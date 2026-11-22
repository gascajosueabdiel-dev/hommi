import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Cat_Sexo = sequelize.define('Cat_Sexo', {
    id_catSexo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sexo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'cat_Sexo',
    timestamps: false
});

export default Cat_Sexo;