import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

class S3Service {
    async generateUploadUrl(fileName, fileType) {
        // Creamos un nombre único para evitar que se sobrescriban fotos
        const uniqueFileName = `${Date.now()}-${fileName}`;
        
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueFileName,
            ContentType: fileType,
        });

        // La URL expira en 60 segundos por seguridad
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return {
            uploadUrl: presignedUrl,
            key: uniqueFileName, // Esta es la ruta que guardarás en la base de datos
            imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`
        };
    }
}

export default new S3Service();