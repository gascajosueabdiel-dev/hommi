import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Alojamiento = sequelize.define('Alojamiento', {
    id_alojamiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    direccion: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    colonia: {
        type: DataTypes.STRING(70),
        allowNull: false
    },
    codigo_postal: {
        type: DataTypes.CHAR(5),
        allowNull: false,
        validate: {
            is: /^[0-9]{5}$/ // Validación del CP
        }
    },
    precio_mensual: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    arrendador_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    disponibilidad_id: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    tableName: 'alojamiento',
    timestamps: false // Esto crea createdAt y updatedAt automáticamente
});

export default Alojamiento;