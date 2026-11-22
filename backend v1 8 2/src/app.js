import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import alojamientoRoutes from "./routes/alojamientoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import resenaRoutes from "./routes/resenaRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Confiar en el proxy de Render (necesario para que rate-limit lea la IP real del usuario)
app.set("trust proxy", 1);

// 2. Cabeceras de seguridad HTTP (permite imágenes externas de AWS S3)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.amazonaws.com",
          "https://*.tile.openstreetmap.org",
          "https://unpkg.com",
        ],
        connectSrc: [
          "'self'",
          "https://*.amazonaws.com",
          "https://nominatim.openstreetmap.org",
          "https://*.tile.openstreetmap.org",
        ],
        frameSrc: [
          "'self'",
          "https://www.openstreetmap.org",
        ],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);


// 3. CORS controlado
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : null;

app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir peticiones sin origin (Postman, curl, mismo dominio) o si no hay lista estricta aún
            if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Origen no permitido por CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "bypass-tunnel-reminder"],
    })
);

app.options("/*any", cors());

// 4. Limitar tamaño del cuerpo JSON (evita saturación de memoria)
app.use(express.json({ limit: "100kb" }));

// 5. Rate Limiting (protección contra fuerza bruta y spam)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 150, // Máximo 150 peticiones por IP cada 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde." },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // Máximo 20 intentos de login/registro cada 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Demasiados intentos de acceso. Espera 15 minutos." },
});

app.use("/api", generalLimiter);
app.use("/api/usuarios/login", authLimiter);
app.use("/api/usuarios/registro", authLimiter);

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, "../public")));

// --- RUTAS DE LA API ---
app.use("/api/alojamientos", alojamientoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/resenas", resenaRoutes);

// Health Ping
app.get("/api/health", (req, res) => res.json({ status: "UP" }));

// --- COMODÍN PARA EL FRONTEND ---
app.get("/*any", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// 6. Manejador global de errores (oculta detalles internos al cliente)
app.use((err, req, res, next) => {
    console.error("Error no controlado:", err.message);
    res.status(err.status || 500).json({
        msg: "Ocurrió un error interno en el servidor.",
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));