import resenaService from '../services/resenaService.js';

export const agregarResena = async (req, res) => {
    try {
        const { alojamientoId } = req.params;
        const { calificacion, comentario } = req.body;
        const { perfilId, tipo } = req.user; // Datos del JWT

        // Validar que solo los estudiantes puedan publicar reseñas
        if (tipo !== 'estudiante') {
            return res.status(403).json({ 
                success: false, 
                msg: 'Solo los estudiantes pueden calificar y comentar alojamientos.' 
            });
        }

        // Validar rango de estrellas
        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ 
                success: false, 
                msg: 'La calificación debe ser un entero entre 1 y 5.' 
            });
        }

        const resena = await resenaService.crearResena(
            alojamientoId, 
            perfilId, 
            parseInt(calificacion), 
            comentario
        );

        res.status(201).json({
            success: true,
            msg: 'Reseña enviada con éxito.',
            data: resena
        });
    } catch (error) {
        if (error.message === 'Alojamiento no encontrado') {
            return res.status(404).json({ success: false, msg: error.message });
        }
        res.status(500).json({ success: false, msg: 'Error al procesar la reseña.', error: error.message });
    }
};

export const getResenasAlojamiento = async (req, res) => {
    try {
        const { alojamientoId } = req.params;
        const resultado = await resenaService.obtenerResenasPorAlojamiento(alojamientoId);
        res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Error al obtener reseñas.', error: error.message });
    }
};

export const deleteResena = async (req, res) => {
    try {
        const { idResena } = req.params;
        const { perfilId, tipo } = req.user;

        await resenaService.eliminarResena(idResena, perfilId, tipo);
        res.status(200).json({ success: true, msg: 'Reseña eliminada correctamente.' });
    } catch (error) {
        if (error.message === 'Reseña no encontrada') return res.status(404).json({ msg: error.message });
        if (error.message === 'No autorizado') return res.status(403).json({ msg: error.message });
        res.status(500).json({ msg: 'Error al eliminar la reseña.', error: error.message });
    }
};