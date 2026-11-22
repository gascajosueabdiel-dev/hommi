import 'dotenv/config';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true, // Esto es lo que pide el error pg_hba
                rejectUnauthorized: false // Para que no falle por certificados auto-firmados de AWS
            }
        }
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('¡CONEXIÓN EXITOSA! Tu backend local ya habla con AWS RDS.');
    } catch (error) {
        console.error('Error de conexión:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();