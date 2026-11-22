// models/Servicio.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Servicio = sequelize.define('Servicio', {
    id_servicio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.STRING(150),
        allowNull: false
    }
}, {
    tableName: 'servicio',
    timestamps: false
});

export default Servicio;