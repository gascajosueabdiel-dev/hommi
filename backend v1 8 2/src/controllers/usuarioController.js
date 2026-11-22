import usuarioService from '../services/usuarioService.js';

// Solo el administrador puede ver la lista completa de usuarios
export const getUsuarios = async (req, res) => {
    try {
        if (req.user.tipo !== 'administrador') {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado. Solo administradores pueden listar usuarios.'
            });
        }

        const data = await usuarioService.listarTodos();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Solo el propio usuario o un administrador pueden consultar el perfil
export const getUsuarioById = async (req, res) => {
    try {
        const idSolicitado = Number(req.params.id);
        const { usuarioId, tipo } = req.user;

        if (tipo !== 'administrador' && usuarioId !== idSolicitado) {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado para ver el perfil de otro usuario.'
            });
        }

        const data = await usuarioService.obtenerPorId(idSolicitado);
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const postEstudiante = async (req, res) => {
    try {
        const resultado = await usuarioService.crearEstudiante(req.body);
        res.status(201).json({
            success: true,
            message: "Estudiante registrado",
            data: resultado
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const postArrendador = async (req, res) => {
    try {
        const resultado = await usuarioService.crearArrendador(req.body);
        res.status(201).json({
            success: true,
            message: "Arrendador registrado",
            data: resultado
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Solo el propio usuario o un administrador pueden editar la cuenta
export const putUsuario = async (req, res) => {
    try {
        const idSolicitado = Number(req.params.id);
        const { usuarioId, tipo } = req.user;

        if (tipo !== 'administrador' && usuarioId !== idSolicitado) {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado para modificar otro usuario.'
            });
        }

        // Evitamos que modifiquen su propio id_usuario
        const { id_usuario, ...datosPermitidos } = req.body;

        const data = await usuarioService.actualizar(idSolicitado, datosPermitidos);
        res.status(200).json({ mensaje: "Actualizado correctamente", data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Solo el propio usuario o un administrador pueden eliminar la cuenta
export const deleteUsuario = async (req, res) => {
    try {
        const idSolicitado = Number(req.params.id);
        const { usuarioId, tipo } = req.user;

        if (tipo !== 'administrador' && usuarioId !== idSolicitado) {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado para eliminar otro usuario.'
            });
        }

        await usuarioService.eliminar(idSolicitado);
        res.status(200).json({ mensaje: "Usuario eliminado" });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const loginUsuario = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const resultado = await usuarioService.login(correo, contrasena);
        
        res.status(200).json({
            success: true,
            message: "Login exitoso",
            data: {
                user_id: resultado.id,
                perfil_id: resultado.perfilId,
                tipo: resultado.tipo,
                token: resultado.token
            }
        });
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: error.message 
        });
    }
};