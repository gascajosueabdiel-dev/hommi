import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Alojamiento from './Alojamiento.js';

const Alojamiento_Imagen = sequelize.define('Alojamiento_Imagen', {
    id_imagen: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    alojamiento_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Alojamiento,
            key: 'id_alojamiento'
        }
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'alojamiento_imagen',
    timestamps: false
});

export default Alojamiento_Imagen;