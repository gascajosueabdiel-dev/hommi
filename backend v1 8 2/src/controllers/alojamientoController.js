import alojamientoService from '../services/alojamientoService.js';
import s3Service from '../services/s3Service.js';

// --- 1. ALTA DE ALOJAMIENTO (Solo Arrendador o Administrador) ---
export const createAlojamiento = async (req, res) => {
    try {
        const { perfilId, tipo } = req.user;

        // Validar rol autorizado
        if (tipo !== 'arrendador' && tipo !== 'administrador') {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado. Solo los arrendadores pueden publicar alojamientos.'
            });
        }

        const serviciosIds = req.body.serviciosIds;
        const imagenesUrls = req.body.imagenesUrls;

        // Forzamos el arrendador_id desde el token JWT para evitar suplantación
        const datosAlojamiento = {
            ...req.body,
            arrendador_id: tipo === 'administrador' && req.body.arrendador_id
                ? req.body.arrendador_id
                : perfilId
        };

        const resultado = await alojamientoService.create(datosAlojamiento, serviciosIds, imagenesUrls);
        return res.status(201).json(resultado);

    } catch (error) {
        console.error("Error en el controlador:", error);
        return res.status(500).json({ 
            success: false,
            msg: "Error interno al crear el alojamiento",
            error: error.message 
        });
    }
};

// --- 2. CONSULTAR TODOS (Estudiante / Invitado) ---
export const getAlojamientos = async (req, res) => {
    try {
        const alojamientos = await alojamientoService.getAllAprobados();
        res.json(alojamientos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            msg: 'Error al obtener alojamientos',
            error: error.message 
        });
    }
};

// --- OBTENER DETALLE DE UN ALOJAMIENTO POR ID ---
export const getAlojamientoById = async (req, res) => {
    const { id } = req.params;

    try {
        const alojamiento = await alojamientoService.getById(id);
        res.json(alojamiento);
    } catch (error) {
        if (error.message === 'Alojamiento no encontrado') {
            return res.status(404).json({ msg: error.message });
        }
        console.error("Error en getAlojamientoById:", error);
        res.status(500).json({ 
            msg: 'Error al obtener los detalles del alojamiento.',
            error: error.message 
        });
    }
};

// --- 3. EDITAR ALOJAMIENTO (Solo dueño o Administrador) ---
export const updateAlojamiento = async (req, res) => {
    const { id } = req.params;
    // Extraemos arrendador_id para descartarlo y evitar que transfieran la propiedad por body
    const { arrendador_id, servicios, serviciosIds, imagenesUrls, ...datosActualizados } = req.body;
    const listaServicios = serviciosIds || servicios;

    try {
        const { perfilId, tipo } = req.user;
        const resultado = await alojamientoService.update(
            id,
            perfilId,
            tipo,
            datosActualizados,
            listaServicios,
            imagenesUrls
        );
        res.json({ msg: 'Actualizado correctamente', alojamiento: resultado });
    } catch (error) {
        if (error.message === 'No autorizado') return res.status(403).json({ msg: error.message });
        if (error.message === 'Alojamiento no encontrado') return res.status(404).json({ msg: error.message });
        res.status(500).json({ msg: 'Error al actualizar', error: error.message });
    }
};

// --- 4. BORRAR ALOJAMIENTO (Solo dueño o Administrador) ---
export const deleteAlojamiento = async (req, res) => {
    const { id } = req.params;

    try {
        const { perfilId, tipo } = req.user;
        await alojamientoService.delete(id, perfilId, tipo);
        res.json({ msg: 'Alojamiento eliminado' });
    } catch (error) {
        if (error.message === 'No autorizado') return res.status(403).json({ msg: error.message });
        if (error.message === 'Alojamiento no encontrado') return res.status(404).json({ msg: error.message });
        
        console.error(error);
        res.status(500).json({ msg: 'Error al eliminar', error: error.message });
    }
};

// --- 5. GENERAR URLS FIRMADAS DE S3 (Solo Arrendador o Administrador) ---
export const getPresignedUrls = async (req, res) => {
    const { archivos } = req.body; 
    const { tipo } = req.user;

    try {
        if (tipo !== 'arrendador' && tipo !== 'administrador') {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado para subir imágenes.'
            });
        }

        if (!archivos || !Array.isArray(archivos) || archivos.length === 0) {
            return res.status(400).json({ 
                success: false, 
                msg: "Debe proporcionar una lista de archivos válida." 
            });
        }

        if (archivos.length > 5) {
            return res.status(400).json({ 
                success: false, 
                msg: "Operación rechazada. No se permite generar más de 5 URLs firmadas por alojamiento." 
            });
        }

        const promesasUrls = archivos.map(async (archivo) => {
            const { fileName, fileType } = archivo;

            if (!fileName || !fileType) {
                throw new Error("Datos incompletos en uno de los archivos");
            }

            const dataS3 = await s3Service.generateUploadUrl(fileName, fileType);
            
            return {
                fileName,
                uploadUrl: dataS3.uploadUrl,
                key: dataS3.key,
                imageUrl: dataS3.imageUrl
            };
        });

        const resultados = await Promise.all(promesasUrls);

        res.json({
            success: true,
            msg: "URLs firmadas generadas con éxito para " + resultados.length + " archivos.",
            archivos: resultados
        });

    } catch (error) {
        console.error("Error en getPresignedUrls:", error);
        res.status(500).json({ 
            success: false, 
            msg: error.message === "Datos incompletos en uno de los archivos" 
                ? "Faltan datos de nombre o tipo en la lista de archivos" 
                : "Error al generar las URLs firmadas de AWS S3" 
        });
    }
};

// BUSCADOR PÚBLICO (Estudiantes e Invitados)
export const buscarAlojamientos = async (req, res) => {
    let { query, precioMax, servicios } = req.query;
    try {
        if (precioMax) {
            precioMax = precioMax.replace(/[^0-9.]/g, ''); 
        }

        const serviciosIds = servicios 
            ? servicios.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [];

        const resultados = await alojamientoService.buscar({ 
            termino: query, 
            precioMax,
            serviciosIds 
        });

        if (resultados.length === 0) {
            return res.status(404).json({ 
                success: false,
                msg: 'No se encontraron alojamientos que coincidan con los criterios de búsqueda.',
                resultados: [] 
            });
        }

        res.json(resultados);
    } catch (error) {
        res.status(500).json({ msg: 'Error en la búsqueda pública', error: error.message });
    }
};

// BUSCADOR PRIVADO (Arrendador - Mis Alojamientos)
// BUSCADOR PRIVADO (Arrendador - Mis Alojamientos)
export const buscarMisAlojamientos = async (req, res) => {
    let { query, precioMax, servicios } = req.query;
    try {
        const { perfilId, tipo } = req.user; 

        // Solo arrendadores o administradores pueden usar el buscador de "Mis Alojamientos"
        if (tipo !== 'arrendador' && tipo !== 'administrador') {
            return res.status(403).json({
                success: false,
                msg: 'No autorizado. Esta sección es exclusiva para arrendadores.'
            });
        }

        if (precioMax) {
            precioMax = precioMax.replace(/[^0-9.]/g, ''); 
        }

        const serviciosIds = servicios 
            ? servicios.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [];

        const resultados = await alojamientoService.buscarMisAlojamientos(
            { termino: query, precioMax, serviciosIds },
            perfilId
        );

        if (resultados.length === 0) {
            return res.status(404).json({ 
                success: false,
                msg: 'No encontramos ninguna de tus propiedades con esos criterios.',
                resultados: [] 
            });
        }

        res.json(resultados);
    } catch (error) {
        res.status(500).json({ msg: 'Error en la búsqueda privada', error: error.message });
    }
};
