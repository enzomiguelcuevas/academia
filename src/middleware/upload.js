const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const path = require('path');

// Configuración de AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Función para generar nombres de archivo únicos
const generateFileName = (originalname, prefix = '') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const extension = path.extname(originalname);
    const baseName = path.basename(originalname, extension);
    
    // Limpiar el nombre del archivo (remover caracteres especiales)
    const cleanName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${prefix}${cleanName}_${timestamp}_${random}${extension}`;
};

// Configuración de multer para S3 - PDFs de libros
const uploadBookPDF = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = generateFileName(file.originalname, 'books/pdfs/');
            cb(null, fileName);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read'
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB máximo para PDFs
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo PDFs
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

// Configuración de multer para portadas de libros
const uploadCoverImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = generateFileName(file.originalname, 'books/covers/');
            cb(null, fileName);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read'
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo para imágenes
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP)'), false);
        }
    }
});

// Configuración combinada para subir PDF y portada juntos
const uploadBookFiles = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            let prefix = '';
            if (file.fieldname === 'pdf') {
                prefix = 'books/pdfs/';
            } else if (file.fieldname === 'portada') {
                prefix = 'books/covers/';
            }
            
            const fileName = generateFileName(file.originalname, prefix);
            cb(null, fileName);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read'
    }),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB máximo
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
            cb(new Error('El PDF debe ser un archivo válido'), false);
        } else if (file.fieldname === 'portada') {
            const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedMimes.includes(file.mimetype)) {
                cb(new Error('La portada debe ser una imagen válida (JPEG, PNG, WebP)'), false);
            } else {
                cb(null, true);
            }
        } else {
            cb(null, true);
        }
    }
}).fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'portada', maxCount: 1 }
]);

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'El archivo es demasiado grande'
            });
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Demasiados archivos'
            });
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Campo de archivo no esperado'
            });
        }
    } else if (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    
    next();
};

// Función para generar URL pública de S3
const getPublicUrl = (key) => {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
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
        console.error('Error eliminando archivo de S3:', error);
        return false;
    }
};

// Función para verificar si archivo existe en S3
const fileExists = async (key) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    try {
        await s3.headObject(params).promise();
        return true;
    } catch (error) {
        return false;
    }
};

// Función para obtener información del archivo
const getFileInfo = async (key) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key
    };

    try {
        const result = await s3.headObject(params).promise();
        return {
            size: result.ContentLength,
            lastModified: result.LastModified,
            contentType: result.ContentType
        };
    } catch (error) {
        return null;
    }
};

module.exports = {
    uploadBookPDF,
    uploadCoverImage,
    uploadBookFiles,
    handleMulterError,
    getPublicUrl,
    deleteFile,
    fileExists,
    getFileInfo,
    generateFileName
};