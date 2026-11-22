//Este archivo define los puntos finales (endpoints) específicos para el recurso de alojamientos en Hommi.

import { Router } from "express";
import * as controller from '../controllers/alojamientoController.js';
// 1. Importa tu middleware de autenticación (el que verifica el JWT)
import { authenticateToken } from '../middlewares/authMiddleware.js'; 

const router = Router();


// El invitado NO puede pedir la URL de S3 (solo quien sube fotos)
router.post('/generate-url', authenticateToken, controller.getPresignedUrls);  //Perdir acceso a S3
//Buscador global (Público: Invitados y Estudiantes)
router.get('/buscar', controller.buscarAlojamientos);
//Buscador interno del Arrendador (Privado: Requiere Token)
router.get('/mi-panel/buscar', authenticateToken,controller.buscarMisAlojamientos);


// El invitado puede ver la lista general (cards)
router.get("/", controller.getAlojamientos); 
router.post("/", authenticateToken, controller.createAlojamiento); // Crear


// El invitado NO puede ver el detalle
router.get("/:id", authenticateToken, controller.getAlojamientoById);
router.put("/:id", authenticateToken, controller.updateAlojamiento); // Actualizar
router.delete("/:id", authenticateToken, controller.deleteAlojamiento);// Borrar

export default router;