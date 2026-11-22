import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Usuario from './Usuario.js';

const Administrador = sequelize.define('Administrador', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Usuario, key: 'id_usuario' }
    }
}, {
    tableName: 'administrador',
    timestamps: false
});

export default Administrador;