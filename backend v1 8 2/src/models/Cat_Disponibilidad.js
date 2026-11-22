// models/CatDisponibilidad.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // Tu archivo de conexión

const Cat_Disponibilidad = sequelize.define('Cat_Disponibilidad', {
    id_catdispon: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    disponibilidad: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'cat_disponibilidad',
    timestamps: false
});

export default Cat_Disponibilidad;