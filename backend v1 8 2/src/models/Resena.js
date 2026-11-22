import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Resena = sequelize.define('Resena', {
    id_resena: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    alojamiento_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    estudiante_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    calificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
            isInt: true
        }
    },
    comentario: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'resena',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Resena;