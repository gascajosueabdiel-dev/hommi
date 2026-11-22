import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Usuario from './Usuario.js';

const Arrendador = sequelize.define('Arrendador', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Usuario, key: 'id_usuario' }
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    estado_verificacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'arrendador',
    timestamps: false
});

export default Arrendador;