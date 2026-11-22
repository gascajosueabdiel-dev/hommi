import { Resena, Estudiante, Usuario, Alojamiento, sequelize } from '../models/index.js';

class ResenaService {
    
    // Crear o actualizar reseña de un estudiante
    async crearResena(alojamientoId, estudianteId, calificacion, comentario) {
        // 1. Verificar si el alojamiento existe
        const alojamiento = await Alojamiento.findByPk(alojamientoId);
        if (!alojamiento) throw new Error('Alojamiento no encontrado');

        // 2. Crear o actualizar si ya existía (upsert pattern)
        const [resena, creada] = await Resena.findOrCreate({
            where: { 
                alojamiento_id: alojamientoId, 
                estudiante_id: estudianteId 
            },
            defaults: { calificacion, comentario }
        });

        if (!creada) {
            // Si ya existía, actualizamos la calificación y el comentario
            resena.calificacion = calificacion;
            resena.comentario = comentario;
            await resena.save();
        }

        return resena;
    }

    // Listar reseñas de un alojamiento con promedio
    async obtenerResenasPorAlojamiento(alojamientoId) {
        const resenas = await Resena.findAll({
        where: { alojamiento_id: alojamientoId },
        attributes: ['id_resena', 'estudiante_id', 'calificacion', 'comentario', 'created_at'], // <--- Incluye la fecha y el autor (estudiante_id)
        include: [{
            model: Estudiante,
            as: 'estudiante',
            include: [{
                model: Usuario,
                attributes: ['nombre']
            }]
        }],
        order: [['created_at', 'DESC']] // <--- Las más recientes primero
    });

        // Calcular promedio de estrellas
        const total = resenas.length;
        const promedio = total > 0 
            ? (resenas.reduce((sum, r) => sum + r.calificacion, 0) / total).toFixed(1)
            : 0;

        return {
            promedio: parseFloat(promedio),
            totalResenas: total,
            resenas
        };
    }

    // Eliminar una reseña
    async eliminarResena(idResena, estudianteId, tipoUsuario) {
        const resena = await Resena.findByPk(idResena);
        if (!resena) throw new Error('Reseña no encontrada');

        // Solo el autor (estudiante) o un administrador pueden borrarla
        if (tipoUsuario !== 'administrador' && resena.estudiante_id !== estudianteId) {
            throw new Error('No autorizado');
        }

        await resena.destroy();
        return { success: true };
    }
}

export default new ResenaService();