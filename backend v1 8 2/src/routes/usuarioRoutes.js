import { Router } from "express";
import * as controller from '../controllers/usuarioController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas públicas (acceso y registro)
router.post('/login', controller.loginUsuario);
router.post('/registro-estudiante', controller.postEstudiante);
router.post('/registro-arrendador', controller.postArrendador);

// Rutas protegidas (requieren JWT válido)
router.get('/', authenticateToken, controller.getUsuarios);
router.get('/:id', authenticateToken, controller.getUsuarioById);
router.put('/:id', authenticateToken, controller.putUsuario);
router.delete('/:id', authenticateToken, controller.deleteUsuario);

export default router;