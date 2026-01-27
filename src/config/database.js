const pgPromise = require('pg-promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la base de datos
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'biblioteca',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // máximo número de conexiones en el pool
    idleTimeoutMillis: 30000, // tiempo de espera para conexiones inactivas
    connectionTimeoutMillis: 2000, // tiempo de espera para conectar
};

const pgp = pgPromise({
    // Inicialización y eventos
    init(options) {
        pgp.pg.types.setTypeParser(1114, stringValue => {
            return stringValue; // Formato de timestamp
        });
    }
});

const db = pgp(config);

// Función para probar la conexión
async function testConnection() {
    try {
        const result = await db.query('SELECT NOW()');
        console.log('✅ Conexión a PostgreSQL exitosa:', result[0].now);
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a PostgreSQL:', error.message);
        return false;
    }
}

// Exportar instancia de base de datos y configuración
module.exports = {
    db,
    pgp,
    testConnection
};