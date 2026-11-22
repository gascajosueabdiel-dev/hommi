import sequelize from '../config/db.js';
import Usuario from './Usuario.js';
import Estudiante from './Estudiante.js';
import Arrendador from './Arrendador.js';
import Administrador from './Administrador.js';
import Cat_Sexo from './Cat_Sexo.js';
import Alojamiento from './Alojamiento.js';
import Servicio from './Servicio.js';
import Cat_Disponibilidad from './Cat_Disponibilidad.js';
import Alojamiento_Imagen from './Alojamiento_Imagen.js';
import Resena from './Resena.js';

// Relaciones
Usuario.hasOne(Estudiante, { foreignKey: 'id_usuario', as: 'perfilEstudiante' });
Estudiante.belongsTo(Usuario, { foreignKey: 'id_usuario' });

Usuario.hasOne(Arrendador, { foreignKey: 'id_usuario', as: 'perfilArrendador' });
Arrendador.belongsTo(Usuario, { foreignKey: 'id_usuario' });

Usuario.hasOne(Administrador, { foreignKey: 'id_usuario', as: 'perfilAdministrador' });
Administrador.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// --- Relaciones de Alojamiento ---
// Relación 1:N (Catálogo disponibilidad)
Alojamiento.belongsTo(Cat_Disponibilidad, { foreignKey: 'disponibilidad_id', as: 'disponibilidad' });
Cat_Disponibilidad.hasMany(Alojamiento, { foreignKey: 'disponibilidad_id' });

// Relación N:M (Muchos a Muchos con Servicios)
// Sequelize creará automáticamente la tabla intermedia 'alojamiento_servicio'
Alojamiento.belongsToMany(Servicio, {
    through: 'alojamiento_servicio',
    foreignKey: 'alojamiento_id',
    otherKey: 'servicio_id',
    timestamps: false,
    as: 'servicios' // Alias útil para el controlador
});
Servicio.belongsToMany(Alojamiento, {
    through: 'alojamiento_servicio',
    foreignKey: 'servicio_id',
    otherKey: 'alojamiento_id',
    timestamps: false
});

// Relación Alojamiento - Arrendador
Alojamiento.belongsTo(Arrendador, { foreignKey: 'arrendador_id', as: 'dueno' });
Arrendador.hasMany(Alojamiento, { foreignKey: 'arrendador_id' });

Alojamiento.hasMany(Alojamiento_Imagen, { 
    foreignKey: 'alojamiento_id', 
    as: 'imagenes',
    onDelete: 'CASCADE' 
});

// Una Imagen pertenece a un solo Alojamiento
Alojamiento_Imagen.belongsTo(Alojamiento, { 
    foreignKey: 'alojamiento_id',
    as: 'alojamiento'
});

// --- Relaciones de Reseñas ---
Alojamiento.hasMany(Resena, { foreignKey: 'alojamiento_id', as: 'resenas' });
Resena.belongsTo(Alojamiento, { foreignKey: 'alojamiento_id', as: 'alojamiento' });

Estudiante.hasMany(Resena, { foreignKey: 'estudiante_id', as: 'resenas' });
Resena.belongsTo(Estudiante, { foreignKey: 'estudiante_id', as: 'estudiante' });

export {
    sequelize,
    Usuario,
    Estudiante,
    Arrendador,
    Administrador,
    Cat_Sexo,
    Alojamiento,
    Servicio,
    Cat_Disponibilidad,
    Alojamiento_Imagen,
    Resena
};

