import { Op } from 'sequelize';
import { Alojamiento, Servicio, Cat_Disponibilidad, Arrendador, Usuario, Alojamiento_Imagen, Resena } from '../models/index.js';
import sequelize from '../config/db.js';

class AlojamientoService {
    
    // 1. Lógica para crear con vinculación de servicios
    async create(datos, serviciosIds, imagenesUrls) {
        return await sequelize.transaction(async (t) => {
            
            // 1. Crear el registro base en la tabla 'alojamiento' (dentro de la transacción)
            const nuevoAlojamiento = await Alojamiento.create(datos, { transaction: t });
            const idAlojamiento = nuevoAlojamiento.id_alojamiento;

            // 2. Vincular los servicios (Mesa intermedia de relación muchos a muchos)
        
            if (serviciosIds && serviciosIds.length > 0) {
                await nuevoAlojamiento.setServicios(serviciosIds,{ transaction: t });
            }
            
            // 3. Vincular las imágenes (Relación 1:N en la tabla 'alojamiento_imagen')
            if (imagenesUrls && Array.isArray(imagenesUrls) && imagenesUrls.length > 0) {
                
                // Mapeamos el arreglo de URLs planas a la estructura que requiere el modelo Alojamiento_Imagen
                const registrosImagenes = imagenesUrls.map(url => ({
                    alojamiento_id: idAlojamiento,
                    url: url
                }));

                // bulkCreate inserta todos los registros de golpe en una sola consulta SQL, súper eficiente
                await Alojamiento_Imagen.bulkCreate(registrosImagenes, { transaction: t });
            }
            // Retornamos el objeto completo incluyendo los servicios vinculados
            return await Alojamiento.findByPk(nuevoAlojamiento.id_alojamiento, {
                include: [
                    { model: Servicio, as: 'servicios' },
                    { model: Alojamiento_Imagen, as: 'imagenes' },
                ],
                transaction: t
            });
        });
    }

    // 2. Lógica para obtener todos los aprobados
    async getAllAprobados() {
        return await Alojamiento.findAll({
            //where: { estado_disponibilidad: 'Aprobado' },
            include: [
                { model: Servicio, as: 'servicios', through: { attributes: [] } },
                { model: Cat_Disponibilidad, as: 'disponibilidad' },
                { model: Alojamiento_Imagen, as: 'imagenes' }
            ]
        });
    }

    async getAllAdmin() {
        return await Alojamiento.findAll({
            include: [
                { model: Servicio, as: 'servicios', through: { attributes: [] } },
                { model: Cat_Disponibilidad, as: 'disponibilidad' },
                { 
                    model: Arrendador, 
                    as: 'dueno', 
                    include: [{ model: Usuario, attributes: ['nombre', 'correo'] }] 
                },
                { model: Alojamiento_Imagen, as: 'imagenes' }
            ]
        });
    }

    // 3. Lógica para obtener por ID
    async getById(id) {
        const alojamiento = await Alojamiento.findByPk(id, {
            include: [
                { model: Servicio, as: 'servicios', through: { attributes: [] } },
                { model: Cat_Disponibilidad, as: 'disponibilidad' },
                { model: Arrendador, as: 'dueno', include: [
                    {
                        model: Usuario,
                        attributes: ['nombre', 'correo']
                    }
                ] },
                { model: Alojamiento_Imagen, as: 'imagenes' }
            ]
        });
        if (!alojamiento) throw new Error('Alojamiento no encontrado');
        return alojamiento;
    }

    // 4. Lógica para actualizar (incluye validación de dueño)
    async update(id, perfilId, tipoUsuario, datos, serviciosIds, imagenesUrls) { 
        return await sequelize.transaction(async (t) => {
            
            // 1. Buscar el alojamiento existente
            const alojamiento = await Alojamiento.findByPk(id, { transaction: t });
            
            if (!alojamiento) throw new Error('Alojamiento no encontrado');

            // 2. Validar propiedad (IDOR): solo el dueño o un administrador pueden editar
            if (tipoUsuario !== 'administrador' && alojamiento.arrendador_id !== perfilId) {
                throw new Error('No autorizado');
            }

            // 3. Actualizar los datos básicos del alojamiento (protegiendo arrendador_id)
            const { arrendador_id, id_alojamiento, ...camposPermitidos } = datos;
            await alojamiento.update(camposPermitidos, { transaction: t });

            // 4. Actualizar la relación de Servicios (Muchos a Muchos)
            if (Array.isArray(serviciosIds)) {
                await alojamiento.setServicios(serviciosIds, { transaction: t });
            }
            
            // 5. Actualizar las Imágenes (Relación 1:N) validando que sean URLs de S3
            if (imagenesUrls && Array.isArray(imagenesUrls)) {
                const urlsValidas = imagenesUrls.filter(
                    (url) => typeof url === 'string' && url.startsWith('https://') && url.includes('amazonaws.com/')
                );

                await Alojamiento_Imagen.destroy({
                    where: { alojamiento_id: id },
                    transaction: t
                });

                if (urlsValidas.length > 0) {
                    const nuevosRegistrosImagenes = urlsValidas.map(url => ({
                        alojamiento_id: id,
                        url: url
                    }));

                    await Alojamiento_Imagen.bulkCreate(nuevosRegistrosImagenes, { transaction: t });
                }
            }
            
            // 6. Retornar el alojamiento completamente actualizado con sus nuevas relaciones
            return await Alojamiento.findByPk(id, {
                include: [
                    { model: Servicio, as: 'servicios' },
                    { model: Alojamiento_Imagen, as: 'imagenes' }
                ],
                transaction: t
            });
        });
    }

// 5. Lógica para eliminar
    async delete(id, perfilId, tipoUsuario) {
        return await sequelize.transaction(async (t) => {
            const alojamiento = await Alojamiento.findByPk(id, { transaction: t });
            
            if (!alojamiento) throw new Error('Alojamiento no encontrado');

            if (tipoUsuario !== 'administrador' && alojamiento.arrendador_id !== perfilId) {
                throw new Error('No autorizado');
            }

            // 1. Limpiar relación N:M en 'alojamiento_servicio'
            await alojamiento.setServicios([], { transaction: t });

            // 2. Eliminar imágenes en 'alojamiento_imagen'
            await Alojamiento_Imagen.destroy({
                where: { alojamiento_id: id },
                transaction: t
            });

            // 3. Eliminar reseñas en 'resena'
            await Resena.destroy({
                where: { alojamiento_id: id },
                transaction: t
            });

            // 4. Eliminar el registro principal en 'alojamiento'
            await alojamiento.destroy({ transaction: t });

            return { success: true };
        });
    }

// Para Estudiantes e Invitados (Busca en todo lo aprobado)
    async buscar(filtros) {
        const { termino, precioMax, serviciosIds } = filtros;
        let whereClause = {}; // meter lógica de 'aprobado'

        if (termino) {
            const terminoLimpio = `%${termino.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}%`;
            whereClause[Op.or] = [
                sequelize.where(
                    sequelize.fn('unaccent', sequelize.fn('lower', sequelize.col('direccion'))),
                    { [Op.like]: terminoLimpio }
                ),
                sequelize.where(
                    sequelize.fn('unaccent', sequelize.fn('lower', sequelize.col('colonia'))),
                    { [Op.like]: terminoLimpio }
                )
            ];
        }

        if (precioMax) {
            whereClause.precio_mensual = { [Op.lte]: parseFloat(precioMax) };
        }

        const includeServicios = {
            model: Servicio,
            as: 'servicios',
            through: { attributes: [] }
        };

        // Si se enviaron IDs de servicios, filtramos en la relación
        if (serviciosIds && serviciosIds.length > 0) {
            includeServicios.where = {
                id_servicio: { [Op.in]: serviciosIds } // <-- Confirma que la PK de tu modelo Servicio sea 'id_servicio'
            };
        }

        const resultados = await Alojamiento.findAll({
            where: whereClause,
            include: [
                includeServicios,
                { model: Alojamiento_Imagen, as: 'imagenes' },
                { model: Cat_Disponibilidad, as: 'disponibilidad' }
            ]
        });

        // Filtro estricto (AND): Asegura que el alojamiento tenga TODOS los servicios pedidos
        if (serviciosIds && serviciosIds.length > 0) {
            return resultados.filter(alojamiento => alojamiento.servicios.length === serviciosIds.length);
        }

        return resultados;
    }

// Para el Arrendador (Busca SOLAMENTE en sus publicaciones)
    async buscarMisAlojamientos(filtros, arrendadorId) {
        const { termino, precioMax, serviciosIds } = filtros;
        
        let whereClause = {
            arrendador_id: arrendadorId
        };

        if (termino) {
            const terminoLimpio = `%${termino.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}%`;
            whereClause[Op.or] = [
                sequelize.where(
                    sequelize.fn('unaccent', sequelize.fn('lower', sequelize.col('direccion'))),
                    { [Op.like]: terminoLimpio }
                ),
                sequelize.where(
                    sequelize.fn('unaccent', sequelize.fn('lower', sequelize.col('colonia'))),
                    { [Op.like]: terminoLimpio }
                )
            ];
        }

        if (precioMax) {
            whereClause.precio_mensual = { [Op.lte]: parseFloat(precioMax) };
        }

        const includeServicios = {
            model: Servicio,
            as: 'servicios',
            through: { attributes: [] }
        };

        if (serviciosIds && serviciosIds.length > 0) {
            includeServicios.where = {
                id_servicio: { [Op.in]: serviciosIds } // <-- Confirma que la PK de tu modelo Servicio sea 'id_servicio'
            };
        }

        const resultados = await Alojamiento.findAll({
            where: whereClause,
            include: [
                includeServicios,
                { model: Alojamiento_Imagen, as: 'imagenes' },
                { model: Cat_Disponibilidad, as: 'disponibilidad' }
            ]
        });

        // Filtro estricto (AND)
        if (serviciosIds && serviciosIds.length > 0) {
            return resultados.filter(alojamiento => alojamiento.servicios.length === serviciosIds.length);
        }

        return resultados;
    }
}
export default new AlojamientoService();