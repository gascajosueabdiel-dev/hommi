# 🏠 Hommi — Alojamiento para estudiantes foráneos

Plataforma web para que estudiantes universitarios encuentren cuartos, departamentos y estudios cerca de su universidad en Querétaro, y para que los arrendadores publiquen y administren sus alojamientos.

> Proyecto académico desarrollado en equipo para las materias de Fundamentos de Software e Ingeniería de Software (TecNM Campus Querétaro).

---

## ✨ Funcionalidades

**Para estudiantes**
- Registro e inicio de sesión
- Búsqueda de alojamientos con filtros (colonia, precio, servicios, disponibilidad)
- Ficha de cada alojamiento con galería de fotos y mapa
- Reseñas de alojamientos

**Para arrendadores**
- Panel para publicar, editar y eliminar alojamientos
- Carga de fotos directo a la nube (Amazon S3)
- Gestión de servicios incluidos (internet, agua, amueblado, etc.)

---

## 🛠️ Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend web | React 19, React Router, Vite, CSS |
| Backend | Node.js, Express 5, Sequelize (ORM) |
| Base de datos | PostgreSQL en AWS RDS |
| Almacenamiento de imágenes | Amazon S3 (URLs prefirmadas) |
| Seguridad | JWT, bcrypt, Helmet, rate limiting |
| Pruebas | Playwright (web), Postman + Newman (API) |

---

## 🏗️ Arquitectura

```
React (Vite)  ──►  API REST (Express)  ──►  PostgreSQL (AWS RDS)
                         │
                         └──►  Amazon S3 (fotos de alojamientos)
```

La API expone tres módulos: **usuarios** (registro de estudiantes y arrendadores, login), **alojamientos** (CRUD, búsqueda y panel del arrendador) y **reseñas**. Las rutas privadas se protegen con tokens JWT.

---

## 👨‍💻 Mi aporte

Mi rol en el equipo fue **Desarrollador**. Participé en la mayor parte del desarrollo del sistema:

**Página web (frontend)**
- **Páginas:** Inicio, Login, Registro, Lista de alojamientos, Detalle del alojamiento y Publicar alojamiento.
- **Componentes:** buscador con filtros, mapa de ubicación, galería de fotos y carga de imágenes a Amazon S3.

**Base de datos**
- **Diseño del modelo relacional** en PostgreSQL: usuarios con herencia por rol (estudiante, arrendador, administrador), alojamientos, imágenes, servicios, reseñas y catálogos.
- **Infraestructura en AWS RDS**: configuración de la instancia, VPC, Security Group, SSL y respaldos automáticos.
- **Sistema de auditoría** con *tablas espejo* (bitácoras), funciones en PL/pgSQL y *triggers* que registran cada alta, cambio y baja en las tablas principales.
- **Vistas y consultas de filtrado** que alimentan la búsqueda de alojamientos.

La documentación técnica completa está en [`database/`](database).

---

## 🚀 Cómo correrlo localmente

**Requisitos:** Node.js 20+, una base de datos PostgreSQL y un bucket de S3.

### Backend
```bash
cd "backend v1 8 2"
npm install
```

Crea un archivo `.env` con tus propios valores:
```env
DB_NAME=hommi_db
DB_USER=TU_USUARIO
DB_PASSWORD=TU_CONTRASEÑA
DB_HOST=TU_HOST
JWT_SECRET=TU_SECRETO
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_BUCKET_NAME=TU_BUCKET
```

```bash
npm start
```

### Frontend
```bash
cd frontend-web
npm install
npm run dev
```

---

## 📁 Estructura

```
hommi/
├── frontend-web/       # Aplicación React
├── backend v1 8 2/     # API REST en Express
└── database/           # Documentación de la base de datos y auditoría
```

---

## 👥 Equipo

| Integrante | Rol |
|---|---|
| Dana Karen Jiménez Moreno | Analista |
| Erik Estrada Vázquez | Diseñador |
| **Josué Abdiel Gasca González** | **Desarrollador** |
| Carlos Emmanuel González Galván | Calidad |

Repositorio original: [Erik-Est-Vaz/Hommi](https://github.com/Erik-Est-Vaz/Hommi)

---

## 📬 Contacto

**Josué Gasca** · Desarrollador web y de bases de datos
✉️ gascajosueabdiel@gmail.com · 🐙 [github.com/gascajosueabdiel-dev](https://github.com/gascajosueabdiel-dev)
