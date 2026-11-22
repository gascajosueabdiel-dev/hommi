import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Usuario = sequelize.define('Usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_usuario'
    },
    nombre: {
        type: DataTypes.STRING(70),
        allowNull: false
    },
    correo: {
        type: DataTypes.STRING(70),
        allowNull: false,
        unique: true,
        validate: {
        isEmail: true, 
        len: [5, 40]   
        }
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [4, 255]
        }
    }
}, {
    tableName: 'usuario',
    freezeTableName: true,
    timestamps: false
});

export default Usuario;