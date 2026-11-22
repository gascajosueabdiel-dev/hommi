## HOMMI — Infraestructura y Base de Datos

> **Reporte Técnico** |
> **Autor:** Josué Abdiel Gasca González  — `l21240205`  
> **Entorno:** AWS RDS (Amazon Relational Database Service) + PostgreSQL 14
> **Rol:** db_developer 
---

## Tabla de Contenidos

- [Infraestructura AWS](#1-infraestructura-aws)
- [Arquitectura de Datos (DDL)](#2-arquitectura-de-datos-ddl)
- [Inserción y Validación (DML)](#3-inserción-y-validación-dml)
- [Auditoría del Sistema](#4-auditoría-del-sistema)
- [Notas Finales de Ingeniería](#5-notas-finales-de-ingeniería)

---

## 1. Infraestructura AWS

Para garantizar la disponibilidad, persistencia y escalabilidad de los datos del proyecto HOMMI, se implementó una instancia de base de datos administrada en AWS. Esta decisión permite desacoplar la lógica de aplicación del almacenamiento, facilitando el escalado independiente de cada capa.

### ¿Por qué AWS RDS?

| Criterio | Justificación |
|---|---|
| Administración automatizada | AWS gestiona parches, backups, failover y monitoreo sin intervención manual |
| Alta disponibilidad | Soporte nativo Multi-AZ para continuidad ante fallos de hardware |
| Escalabilidad | CPU, RAM y almacenamiento escalables en caliente sin tiempo de inactividad |
| Seguridad certificada | Cumplimiento ISO 27001, SOC 2 y PCI DSS; cifrado AES-256 en reposo y SSL/TLS en tránsito |
| Capa gratuita | `db.t3.micro` disponible sin costo por 12 meses, ideal para fase académica |

### Especificaciones de la Instancia

| Parámetro | Valor |
|---|---|
| Motor | PostgreSQL 14+ |
| Clase de instancia | `db.t3.micro` (2 vCPU, 1 GB RAM) |
| Almacenamiento | 20 GB SSD gp2 con autoescalado habilitado |
| Región | `us-east-1` (Norte de Virginia) |
| Puerto | `5432` (TCP/IP estándar PostgreSQL) |
| Backups automáticos | Retención 7 días — ventana `03:00–04:00 UTC` |
| Monitoreo | CloudWatch habilitado (CPU, I/O, conexiones) |

### Conectividad y Seguridad de Red

La instancia reside dentro de una **VPC (Virtual Private Cloud)**, aislando el tráfico del internet público. Los controles de acceso son:

- **Endpoint de conexión:** Hostname único proporcionado por AWS, usado en pgAdmin 4 o `psql`.
- **Security Group:** Firewall virtual que permite tráfico TCP en el puerto `5432` únicamente desde la IP estática del desarrollador.
- **Autenticación:** Usuario maestro `postgres` con contraseña cifrada. Para producción se recomienda migrar a IAM Database Authentication.
- **Cifrado en tránsito:** SSL/TLS obligatorio en toda comunicación cliente-servidor.

>  **Nota de seguridad:** En producción, colocar la instancia en una **subred privada** y acceder únicamente vía bastion host o VPN privada.

### Cadena de Conexión

```bash
# Conexión via CLI
psql --host=<endpoint>.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=hommi_db

# URI para ORMs y aplicaciones
postgresql://postgres:<password>@<endpoint>:5432/hommi_db?sslmode=require
```

---

## 2. Arquitectura de Datos (DDL)

El esquema sigue la **Tercera Forma Normal (3FN)** y un patrón de **herencia de tabla por tipo (Table-Per-Type)**, donde `usuario` es la entidad maestra y las tablas de roles la extienden mediante relaciones uno-a-uno.

### Capas del Modelo

```
┌──────────────────────────────────────────────┐
│  CAPA DE CATÁLOGOS                           │
│  cat_sexo · cat_disponibilidad · servicio    │
├──────────────────────────────────────────────┤
│  CAPA DE IDENTIDAD                           │
│  usuario  (entidad maestra)                  │
├──────────────────────────────────────────────┤
│  CAPA DE ROLES                               │
│  estudiante · arrendador · administrador     │
├──────────────────────────────────────────────┤
│  CAPA DE NEGOCIO                             │
│  alojamiento · alojamiento_servicio          │
└──────────────────────────────────────────────┘
```

### 2.1 Tablas de Catálogo

Almacenan dominios controlados para normalizar datos y evitar literales duplicados en las tablas operacionales.

```sql
-- Géneros (evita texto libre)
CREATE TABLE cat_sexo (
    id_catsexo  SERIAL PRIMARY KEY,
    sexo        VARCHAR(20) NOT NULL UNIQUE
);

-- Estados de disponibilidad de alojamiento
CREATE TABLE cat_disponibilidad (
    id_catdispon    SERIAL PRIMARY KEY,
    disponibilidad  VARCHAR(30) NOT NULL UNIQUE
);

-- Servicios ofrecidos en alojamientos
CREATE TABLE servicio (
    id_servicio SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE
);
```

### 2.2 Tablas Operacionales

```sql
-- ENTIDAD MAESTRA: Identidad centralizada
CREATE TABLE usuario (
    id_usuario  SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    correo      VARCHAR(100) UNIQUE NOT NULL,
    contrasena  VARCHAR(255) NOT NULL   -- Almacena hash bcrypt/argon2, nunca texto plano
);

-- ROL: Estudiante
CREATE TABLE estudiante (
    id_usuario  INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_catsexo  INT REFERENCES cat_sexo(id_catsexo),
    universidad VARCHAR(100) NOT NULL
);

-- ROL: Arrendador (propietario con proceso de verificación KYC)
CREATE TABLE arrendador (
    id_usuario          INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    telefono            VARCHAR(15) NOT NULL UNIQUE,
    estado_verificacion BOOLEAN DEFAULT FALSE
);

-- ROL: Administrador
CREATE TABLE administrador (
    id_usuario INT PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE
);
```

### 2.3 Tablas de Negocio

```sql
-- Inventario de alojamientos
CREATE TABLE alojamiento (
    id_alojamiento  SERIAL PRIMARY KEY,
    id_arrendador   INT REFERENCES arrendador(id_usuario) ON DELETE SET NULL,
    id_catdispon    INT REFERENCES cat_disponibilidad(id_catdispon),
    direccion       TEXT NOT NULL,
    precio_mensual  DECIMAL(10,2) NOT NULL   -- Máx: 99,999,999.99 MXN
);

-- Relación N:M — Un alojamiento tiene múltiples servicios
--               Un servicio aplica a múltiples alojamientos
CREATE TABLE alojamiento_servicio (
    alojamiento_id  INT REFERENCES alojamiento(id_alojamiento) ON DELETE CASCADE,
    servicio_id     INT REFERENCES servicio(id_servicio) ON DELETE CASCADE,
    PRIMARY KEY (alojamiento_id, servicio_id)   -- Llave compuesta evita duplicados
);
```

>  **Seguridad:** El campo `contrasena` debe almacenar siempre el hash de `bcrypt` (costo mínimo 12) o `Argon2id`. Nunca guardar contraseñas en texto plano.

---

## 3. Inserción y Validación (DML)

Los scripts se ejecutan en orden estricto de dependencias: **catálogos → usuarios/roles → negocio**.

### Paso 1 — Catálogos (sin dependencias)

```sql
INSERT INTO cat_sexo (sexo)
VALUES ('Masculino'), ('Femenino'), ('Prefiero no decirlo');

INSERT INTO cat_disponibilidad (disponibilidad)
VALUES ('Disponible'), ('Ocupado'), ('En mantenimiento'), ('Reservado');

INSERT INTO servicio (nombre)
VALUES ('WiFi'), ('Agua Caliente'), ('Luz Incluida'),
       ('Estacionamiento'), ('Lavandería'), ('Amueblado');
```

### Paso 2 — Usuarios y Roles

```sql
-- Tabla maestra
INSERT INTO usuario (nombre, correo, contrasena)
VALUES
    ('Josué Abdiel', 'josue@hommi.com',  '$2b$12$hash_bcrypt_01'),
    ('María López',  'maria@hommi.com',  '$2b$12$hash_bcrypt_02'),
    ('Carlos Ruiz',  'carlos@hommi.com', '$2b$12$hash_bcrypt_03');

-- Asignación de roles
INSERT INTO estudiante (id_usuario, id_catsexo, universidad)
VALUES
    (1, 1, 'Instituto Tecnológico de León'),
    (2, 2, 'Universidad de Guanajuato');

INSERT INTO arrendador (id_usuario, telefono, estado_verificacion)
VALUES (3, '477-123-4567', FALSE);
```

### Paso 3 — Alojamientos y Servicios

```sql
INSERT INTO alojamiento (id_arrendador, id_catdispon, direccion, precio_mensual)
VALUES
    (3, 1, 'Calle Reforma #42, Col. Centro, León, Gto.',        3500.00),
    (3, 2, 'Blvd. López Mateos #210, Depto 5, León, Gto.',      4200.00);

-- Alojamiento 1: WiFi + Agua Caliente + Luz
INSERT INTO alojamiento_servicio (alojamiento_id, servicio_id)
VALUES (1, 1), (1, 2), (1, 3);

-- Alojamiento 2: WiFi + Estacionamiento + Amueblado
INSERT INTO alojamiento_servicio (alojamiento_id, servicio_id)
VALUES (2, 1), (2, 4), (2, 6);
```

---

## 4. Auditoría del Sistema

Consultas de verificación ejecutadas directamente sobre la instancia RDS para certificar integridad del esquema y comportamiento de los constraints.

### 4.1 Verificar Tablas Creadas

```sql
SELECT table_name, table_type
FROM   information_schema.tables
WHERE  table_schema = 'public'
ORDER  BY table_name;

-- Resultado esperado: 9 tablas
-- administrador, alojamiento, alojamiento_servicio,
-- arrendador, cat_disponibilidad, cat_sexo,
-- estudiante, servicio, usuario
```

### 4.2 Verificar Integridad con JOINs

```sql
-- Usuario con su rol de Estudiante
SELECT
    U.id_usuario,
    U.nombre       AS nombre_completo,
    U.correo,
    CS.sexo,
    E.universidad
FROM usuario U
INNER JOIN estudiante E  ON U.id_usuario = E.id_usuario
INNER JOIN cat_sexo  CS  ON E.id_catsexo = CS.id_catsexo;

-- Alojamiento con todos sus servicios (relación N:M resuelta)
SELECT
    A.id_alojamiento,
    A.direccion,
    A.precio_mensual,
    CD.disponibilidad,
    STRING_AGG(S.nombre, ', ') AS servicios_incluidos
FROM alojamiento A
INNER JOIN cat_disponibilidad   CD   ON A.id_catdispon    = CD.id_catdispon
INNER JOIN alojamiento_servicio AS_T ON A.id_alojamiento  = AS_T.alojamiento_id
INNER JOIN servicio             S    ON AS_T.servicio_id  = S.id_servicio
GROUP BY A.id_alojamiento, A.direccion, A.precio_mensual, CD.disponibilidad;
```

### 4.3 Verificar Comportamiento ON DELETE CASCADE

```sql
BEGIN; -- Transacción para poder revertir

    -- Confirmar existencia antes del DELETE
    SELECT COUNT(*) FROM estudiante WHERE id_usuario = 1;  -- Debe retornar 1

    -- Eliminar usuario maestro
    DELETE FROM usuario WHERE id_usuario = 1;

    -- Confirmar eliminación en cascada
    SELECT COUNT(*) FROM estudiante WHERE id_usuario = 1;  -- Debe retornar 0

ROLLBACK; -- Revertir para conservar datos de prueba
```

---

## 5. Notas Finales de Ingeniería

### Escalabilidad

- **Escalado vertical:** Cambio de `db.t3.micro` a instancias superiores sin modificar el endpoint de conexión.
- **Auto Scaling de almacenamiento:** El disco crece automáticamente al superar el 90% de uso (incrementos de 10 GB).
- **Read Replicas:** Hasta 5 réplicas de solo lectura para distribuir la carga de consultas `SELECT` del frontend.
- **Particionamiento:** La tabla `alojamiento` puede particionarse por región geográfica al superar el millón de registros.

### Seguridad y Privacidad

- **`ON DELETE CASCADE`:** Garantiza la eliminación automática de datos sensibles de roles al borrar un usuario — cumple con derecho al olvido (GDPR Art. 17 / LFPDPPP).
- **Hashing de contraseñas:** El campo `contrasena` solo almacena hashes irreversibles, protegiendo credenciales incluso ante acceso directo a la BD.
- **Mínimo privilegio:** Crear usuarios de BD diferenciados por rol (`readonly` para frontend, `admin` solo para DDL).
- **Auditoría de accesos:** Integración con AWS CloudTrail para registrar todas las operaciones administrativas.

### Mantenibilidad

- **Nomenclatura `id_tabla`:** Permite identificar relaciones de forma intuitiva en cualquier consulta JOIN.
- **Catálogos centralizados:** Nuevos valores se agregan sin modificar la estructura de tablas operacionales.
- **Herencia Table-Per-Type:** Permite agregar nuevos roles extendiendo solo `usuario`, sin reestructurar el esquema existente.
- **Transacciones:** Toda modificación crítica debe ejecutarse dentro de bloques `BEGIN/COMMIT` para garantizar atomicidad.
