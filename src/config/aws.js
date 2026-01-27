const AWS = require('aws-sdk');

// Configuración de AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Nombre del bucket
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Función para subir archivo a S3
const uploadFile = async (file, key, contentType = 'application/octet-stream') => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer || file,
        ContentType: contentType,
        ACL: 'public-read' // Hacer el archivo público
    };

    try {
        const result = await s3.upload(params).promise();
        return result;
    } catch (error) {
        console.error('Error al subir archivo a S3:', error);
        throw error;
    }
};

// Función para eliminar archivo de S3
const deleteFile = async (key) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    try {
        await s3.deleteObject(params).promise();
        return true;
    } catch (error) {
        console.error('Error al eliminar archivo de S3:', error);
        throw error;
    }
};

// Función para generar URL pre-signed para descarga segura
const getSignedUrl = async (key, expiresIn = 3600) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn
    };

    try {
        const url = await s3.getSignedUrlPromise('getObject', params);
        return url;
    } catch (error) {
        console.error('Error al generar URL firmada:', error);
        throw error;
    }
};

// Función para listar archivos en un directorio específico
const listFiles = async (prefix = '') => {
    const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 1000
    };

    try {
        const result = await s3.listObjectsV2(params).promise();
        return result.Contents || [];
    } catch (error) {
        console.error('Error al listar archivos:', error);
        throw error;
    }
};

// Función para verificar si un archivo existe
const fileExists = async (key) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    try {
        await s3.headObject(params).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
};

module.exports = {
    s3,
    uploadFile,
    deleteFile,
    getSignedUrl,
    listFiles,
    fileExists,
    BUCKET_NAME
};