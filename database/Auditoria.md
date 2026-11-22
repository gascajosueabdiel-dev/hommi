
## 1. Resumen del Proyecto

Se implementó un sistema de auditoría integral para el proyecto de gestión de
viviendas estudiantiles HOMMI. El sistema utiliza una arquitectura de Tablas Espejo
y Triggers en PostgreSQL para garantizar el rastreo de cada inserción, modificación
y eliminación en las 9 tablas principales del esquema.

---

## 2. Infraestructura de Tablas Espejo

Se crearon 9 tablas de bitácora diseñadas para capturar los datos históricos (`_old`),
el tipo de acción realizada (`A`, `B` o `C`), el usuario responsable y la marca de tiempo.

```sql
-- Ejemplo de creación de Tabla Espejo (Usuario)
CREATE TABLE usuario_bitacora (
    id_bitacora    SERIAL PRIMARY KEY,
    id_usuario_old INT,
    nombre_old     VARCHAR(100),
    correo_old     VARCHAR(100),
    accion         CHAR(1) CHECK (accion IN ('A', 'B', 'C')),
    usuario_ejecuto VARCHAR(50) DEFAULT CURRENT_USER,
    fecha_registro  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Este patrón se replicó para: Estudiante, Arrendador, Administrador, Alojamiento,
Servicio, Cat_Sexo, Cat_Disponibilidad y Alojamiento_Servicio.

---

## 3. Lógica de Programación (Functions)

Se desarrollaron funciones en PL/pgSQL especializadas para procesar las operaciones
DML y decidir qué datos persistir en la bitácora.

```sql
-- Función de Auditoría para Alojamientos
CREATE OR REPLACE FUNCTION fn_auditoria_alojamiento() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO alojamiento_bitacora (id_alojamiento_old, accion)
        VALUES (NEW.id_alojamiento, 'A');

    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO alojamiento_bitacora (id_alojamiento_old, direccion_old, precio_old, accion)
        VALUES (OLD.id_alojamiento, OLD.direccion, OLD.precio_mensual, 'C');

    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO alojamiento_bitacora (id_alojamiento_old, direccion_old, precio_old, accion)
        VALUES (OLD.id_alojamiento, OLD.direccion, OLD.precio_mensual, 'B');
    END IF;

    RETURN (CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Configuración de Triggers (Disparadores)

Se configuraron disparadores específicos para asegurar que ninguna acción pase inadvertida.

| Tipo | Descripción |
|------|-------------|
| `BEFORE DELETE` | Se activa antes de borrar para capturar los datos que dejarán de existir. |
| `AFTER INSERT/UPDATE` | Se activa tras confirmar que el cambio fue exitoso. |

```sql
-- Activación de Triggers para la tabla Alojamiento
CREATE TRIGGER tr_alojamiento_cambios
AFTER INSERT OR UPDATE ON alojamiento
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_alojamiento();

CREATE TRIGGER tr_alojamiento_bajas
BEFORE DELETE ON alojamiento
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_alojamiento();
```

---

## 5. Validación de Resultados

| Prueba | Acción | Resultado en Bitácora |
|--------|--------|-----------------------|
| INSERT | `A` (Alta) | Se registra el ID del nuevo servicio creado. |
| UPDATE | `C` (Cambio) | Se guarda el valor anterior (Ej. `precio_old`). |
| DELETE | `B` (Baja) | Se preservan los datos antes de eliminarlos. |
