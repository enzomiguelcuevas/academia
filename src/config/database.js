const pgp = require('pg-promise')(); // Se inicializa una sola vez aquí
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la base de datos
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'biblioteca',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

// Crear la instancia de la base de datos
const db = pgp(config);

// Función para probar la conexión con reintentos
async function testConnection(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await db.query('SELECT NOW()');
            console.log('✅ Conexión a PostgreSQL exitosa:', result[0].now);
            return true;
        } catch (error) {
            console.error(`❌ Intento ${i + 1}/${retries} - Error al conectar a PostgreSQL:`, error.message);
            if (i < retries - 1) {
                console.log(`⏳ Reintentando en 5 segundos...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.error('❌ No se pudo conectar a PostgreSQL después de varios intentos');
                return false;
            }
        }
    }
}

module.exports = {
    db,
    pgp,
    testConnection
};