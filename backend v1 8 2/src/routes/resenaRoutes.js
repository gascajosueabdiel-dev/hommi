import { Router } from "express";
import * as controller from '../controllers/resenaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Pública: Cualquiera puede ver las reseñas y el promedio de un alojamiento
router.get('/alojamiento/:alojamientoId', controller.getResenasAlojamiento);

// Privada (Estudiantes): Publicar/editar reseña
router.post('/alojamiento/:alojamientoId', authenticateToken, controller.agregarResena);

// Privada: Eliminar reseña
router.delete('/:idResena', authenticateToken, controller.deleteResena);

export default router;