# Informe de Implementación de Base de Datos - Proyecto HOMMI

**Nombre:** Josué Abdiel Gasca González
**Fecha:** 6 de mayo de 2026

---

## 1. Introducción

El presente documento detalla la arquitectura de base de datos diseñada para "HOMMI",
una plataforma de gestión de alojamiento estudiantil. El sistema ha sido estructurado
para garantizar la integridad referencial y facilitar la escalabilidad a través de una
arquitectura normalizada y el uso de vistas para la abstracción de datos.

---

## 2. Arquitectura del Sistema (Script DDL - Tablas)

```sql
CREATE TABLE usuario (
    id_usuario    SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    correo        VARCHAR(100) UNIQUE NOT NULL,
    contrasena    VARCHAR(255) NOT NULL
);

CREATE TABLE cat_sexo (
    id_catsexo SERIAL PRIMARY KEY,
    sexo       VARCHAR(20)
);

CREATE TABLE cat_disponibilidad (
    id_catdispon   SERIAL PRIMARY KEY,
    disponibilidad VARCHAR(20)
);

CREATE TABLE servicio (
    id_servicio SERIAL PRIMARY KEY,
    nombre      VARCHAR(50),
    descripcion TEXT
);

CREATE TABLE estudiante (
    id_usuario  INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_catsexo  INT REFERENCES cat_sexo(id_catsexo),
    universidad VARCHAR(100) NOT NULL
);

CREATE TABLE arrendador (
    id_usuario          INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    telefono            VARCHAR(15) NOT NULL UNIQUE,
    estado_verificacion BOOLEAN DEFAULT FALSE
);

CREATE TABLE administrador (
    id_usuario INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE alojamiento (
    id_alojamiento    SERIAL PRIMARY KEY,
    arrendador_id     INT REFERENCES arrendador(id_usuario),
    disponibilidad_id INT REFERENCES cat_disponibilidad(id_catdispon),
    direccion         TEXT NOT NULL,
    precio_mensual    DECIMAL(10,2) NOT NULL,
    descripcion       TEXT,
    foto_url          VARCHAR(255)
);

CREATE TABLE alojamiento_servicio (
    alojamiento_id INT REFERENCES alojamiento(id_alojamiento),
    servicio_id    INT REFERENCES servicio(id_servicio),
    PRIMARY KEY (alojamiento_id, servicio_id)
);
```

---

## 3. Abstracción y Consultas (Script de Vistas)

```sql
-- VISTA DE ALOJAMIENTOS
CREATE OR REPLACE VIEW vista_alojamientos AS
SELECT
    a.id_alojamiento,
    a.direccion,
    a.precio_mensual,
    cd.disponibilidad
FROM alojamiento a
JOIN cat_disponibilidad cd ON a.disponibilidad_id = cd.id_catdispon;

-- VISTA DE ESTUDIANTES
CREATE OR REPLACE VIEW vista_estudiantes AS
SELECT
    u.nombre,
    e.universidad,
    c.sexo
FROM estudiante e
JOIN usuario u ON e.id_usuario = u.id_usuario
JOIN cat_sexo c ON e.id_catsexo = c.id_catsexo;
```

---

## 4. Validación de Datos

Se verifica que la consulta retorna los datos almacenados correctamente,
confirmando la integridad de las relaciones.

---

## 5. Consultas de Filtrado (DQL Adicional)

```sql
-- Filtrado de alojamientos económicos
SELECT direccion, precio_mensual
FROM alojamiento
WHERE precio_mensual < 5000;

-- Unión específica para verificar contactos de arrendadores
SELECT u.nombre, ar.telefono
FROM usuario u
JOIN arrendador ar ON u.id_usuario = ar.id_usuario;
```

---

## 6. Conclusiones y Siguientes Pasos

La implementación de vistas permitió simplificar la complejidad de las consultas
para el frontend del sistema. El diseño actual cumple con los estándares de
normalización requeridos para evitar redundancia de datos.

**Siguientes pasos:** El siguiente objetivo es la implementación de Triggers para
la auditoría automática de cambios en la base de datos.
