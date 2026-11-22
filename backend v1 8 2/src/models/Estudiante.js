import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Usuario from './Usuario.js';
import Cat_Sexo from './Cat_Sexo.js';

const Estudiante = sequelize.define('Estudiante', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Usuario, key: 'id_usuario' }
    },
    universidad: {
        type: DataTypes.STRING(70),
        allowNull: false,
        unique: true
    },
    id_catsexo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Cat_Sexo, key: 'id_catsexo' }
    }
}, {
    tableName: 'estudiante',
    freezeTableName: true,
    timestamps: false
});

export default Estudiante;