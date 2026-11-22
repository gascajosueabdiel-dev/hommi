import { Usuario, Estudiante, Arrendador, Administrador, sequelize } from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

class UsuarioService {

    // GET: Obtener todos los usuarios con sus perfiles (sin exponer contraseñas)
    async listarTodos() {
        return await Usuario.findAll({
            attributes: { exclude: ['contrasena'] },
            include: [
                { model: Estudiante, as: 'perfilEstudiante' },
                { model: Arrendador, as: 'perfilArrendador' }
            ]
        });
    }

    // GET :id - Obtener un usuario específico por ID (sin exponer contraseña)
    async obtenerPorId(id) {
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['contrasena'] },
            include: [
                { model: Estudiante, as: 'perfilEstudiante' },
                { model: Arrendador, as: 'perfilArrendador' }
            ]
        });
        if (!usuario) throw new Error('Usuario no encontrado');
        return usuario;
    }

    // Registro de Estudiante con Transacción y contraseña encriptada
    async crearEstudiante(datos) {
        const t = await sequelize.transaction();
        try {
            const hashedPassword = await bcrypt.hash(datos.contrasena, SALT_ROUNDS);

            const usuario = await Usuario.create({
                nombre: datos.nombre,
                correo: datos.correo,
                contrasena: hashedPassword
            }, { transaction: t });

            const estudiante = await Estudiante.create({
                id_usuario: usuario.id_usuario,
                universidad: datos.universidad,
                id_catsexo: datos.id_catsexo
            }, { transaction: t });

            await t.commit();

            // Devolvemos el usuario sin el campo contrasena
            const usuarioSeguro = usuario.toJSON();
            delete usuarioSeguro.contrasena;

            return { usuario: usuarioSeguro, estudiante };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // Registro de Arrendador con contraseña encriptada
    async crearArrendador(datos) {
        const t = await sequelize.transaction();
        try {
            const hashedPassword = await bcrypt.hash(datos.contrasena, SALT_ROUNDS);

            const usuario = await Usuario.create({
                nombre: datos.nombre,
                correo: datos.correo,
                contrasena: hashedPassword
            }, { transaction: t });

            const arrendador = await Arrendador.create({
                id_usuario: usuario.id_usuario,
                telefono: datos.telefono
            }, { transaction: t });

            await t.commit();

            const usuarioSeguro = usuario.toJSON();
            delete usuarioSeguro.contrasena;

            return { usuario: usuarioSeguro, arrendador };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // PUT - Actualizar datos del usuario (si envía nueva contraseña, se encripta)
    async actualizar(id, datos) {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        const datosActualizados = { ...datos };
        if (datosActualizados.contrasena) {
            datosActualizados.contrasena = await bcrypt.hash(datosActualizados.contrasena, SALT_ROUNDS);
        }

        await usuario.update(datosActualizados);

        const usuarioSeguro = usuario.toJSON();
        delete usuarioSeguro.contrasena;
        return usuarioSeguro;
    }

    // DELETE - Eliminar usuario
    async eliminar(id) {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) throw new Error('Usuario no encontrado');
        return await usuario.destroy();
    }
    
    // Login con soporte para contraseñas encriptadas y migración automática de las antiguas
    async login(correo, contrasena) {
        const usuario = await Usuario.findOne({ 
            where: { correo: correo },
            include: [
                { model: Estudiante, as: 'perfilEstudiante' },
                { model: Arrendador, as: 'perfilArrendador' },
                { model: Administrador, as: 'perfilAdministrador' },
            ]
        });

        if (!usuario) throw new Error('Correo o contraseña incorrectos');

        const esHashBcrypt = usuario.contrasena.startsWith('$2a$') || usuario.contrasena.startsWith('$2b$');
        let passwordValida = false;

        if (esHashBcrypt) {
            passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);
        } else {
            // Compatibilidad con usuarios existentes en texto plano
            passwordValida = (usuario.contrasena === contrasena);
            if (passwordValida) {
                // Migramos automáticamente su contraseña a bcrypt en la BD
                const nuevoHash = await bcrypt.hash(contrasena, SALT_ROUNDS);
                await usuario.update({ contrasena: nuevoHash });
            }
        }

        if (!passwordValida) throw new Error('Correo o contraseña incorrectos');

        let tipo = null;
        let perfilId = null;
        const userIdReal = usuario.id_usuario; 

        if (usuario.perfilEstudiante) {
            tipo = 'estudiante';
            perfilId = usuario.perfilEstudiante.id_usuario; 
        } else if (usuario.perfilArrendador) {
            tipo = 'arrendador';
            perfilId = usuario.perfilArrendador.id_usuario; 
        } else if (usuario.perfilAdministrador) {
            tipo = 'administrador';
            perfilId = usuario.perfilAdministrador.id_usuario; 
        } 

        const secret = process.env.JWT_SECRET || 'secret';
        const token = jwt.sign(
            { 
                usuarioId: userIdReal, 
                perfilId: perfilId, 
                tipo: tipo 
            },
            secret, 
            { expiresIn: '2h' }
        );

        return {
            id: userIdReal,
            perfilId: perfilId,
            tipo: tipo,
            token: token
        };
    }
}

export default new UsuarioService();