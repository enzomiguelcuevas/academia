const { db } = require('../config/database');

class Descarga {
    // Registrar nueva descarga
    static async registrar(usuario_id, libro_id, ip_address = null) {
        const query = `
            INSERT INTO descargas (usuario_id, libro_id, ip_address)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        
        try {
            const result = await db.one(query, [usuario_id, libro_id, ip_address]);
            return result;
        } catch (error) {
            throw new Error(`Error al registrar descarga: ${error.message}`);
        }
    }

    // Obtener descargas de un usuario
    static async obtenerPorUsuario(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT d.*, l.titulo, l.autor, l.portada_url, d.fecha_descarga
            FROM descargas d
            JOIN libros l ON d.libro_id = l.id
            WHERE d.usuario_id = $1
            ORDER BY d.fecha_descarga DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [usuario_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener descargas del usuario: ${error.message}`);
        }
    }

    // Obtener descargas de un libro
    static async obtenerPorLibro(libro_id, limit = 50, offset = 0) {
        const query = `
            SELECT d.*, u.nombre, u.apellido, u.dni, d.fecha_descarga
            FROM descargas d
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE d.libro_id = $1
            ORDER BY d.fecha_descarga DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [libro_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener descargas del libro: ${error.message}`);
        }
    }

    // Obtener todas las descargas (admin)
    static async obtenerTodas(limit = 50, offset = 0) {
        const query = `
            SELECT d.*, u.nombre, u.apellido, u.dni, l.titulo, l.autor
            FROM descargas d
            JOIN usuarios u ON d.usuario_id = u.id
            JOIN libros l ON d.libro_id = l.id
            ORDER BY d.fecha_descarga DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener descargas: ${error.message}`);
        }
    }

    // Contar descargas de un usuario
    static async contarPorUsuario(usuario_id) {
        const query = 'SELECT COUNT(*) as total FROM descargas WHERE usuario_id = $1';
        
        try {
            const result = await db.one(query, [usuario_id]);
            return parseInt(result.total);
        } catch (error) {
            throw new Error(`Error al contar descargas del usuario: ${error.message}`);
        }
    }

    // Contar descargas de un libro
    static async contarPorLibro(libro_id) {
        const query = 'SELECT COUNT(*) as total FROM descargas WHERE libro_id = $1';
        
        try {
            const result = await db.one(query, [libro_id]);
            return parseInt(result.total);
        } catch (error) {
            throw new Error(`Error al contar descargas del libro: ${error.message}`);
        }
    }

    // Obtener estadísticas de descargas
    static async obtenerEstadisticas() {
        const query = `
            SELECT 
                COUNT(*) as total_descargas,
                COUNT(DISTINCT usuario_id) as usuarios_unicos,
                COUNT(DISTINCT libro_id) as libros_descargados,
                DATE_TRUNC('day', MAX(fecha_descarga)) as ultima_descarga
            FROM descargas
        `;
        
        try {
            const result = await db.one(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de descargas: ${error.message}`);
        }
    }

    // Obtener descargas por período
    static async obtenerPorPeriodo(fecha_inicio, fecha_fin) {
        const query = `
            SELECT 
                DATE_TRUNC('day', fecha_descarga) as fecha,
                COUNT(*) as total_descargas,
                COUNT(DISTINCT usuario_id) as usuarios_unicos
            FROM descargas
            WHERE fecha_descarga BETWEEN $1 AND $2
            GROUP BY DATE_TRUNC('day', fecha_descarga)
            ORDER BY fecha DESC
        `;
        
        try {
            const result = await db.manyOrNone(query, [fecha_inicio, fecha_fin]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener descargas por período: ${error.message}`);
        }
    }

    // Obtener libros más descargados
    static async obtenerLibrosMasDescargados(limit = 10, dias = 30) {
        const query = `
            SELECT 
                l.id,
                l.titulo,
                l.autor,
                l.portada_url,
                COUNT(d.id) as total_descargas,
                COUNT(DISTINCT d.usuario_id) as usuarios_unicos
            FROM libros l
            JOIN descargas d ON l.id = d.libro_id
            WHERE d.fecha_descarga >= CURRENT_TIMESTAMP - INTERVAL '${dias} days'
            GROUP BY l.id, l.titulo, l.autor, l.portada_url
            ORDER BY total_descargas DESC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener libros más descargados: ${error.message}`);
        }
    }

    // Obtener usuarios más activos (más descargas)
    static async obtenerUsuariosMasActivos(limit = 10, dias = 30) {
        const query = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.dni,
                COUNT(d.id) as total_descargas,
                COUNT(DISTINCT d.libro_id) as libros_unicos
            FROM usuarios u
            JOIN descargas d ON u.id = d.usuario_id
            WHERE d.fecha_descarga >= CURRENT_TIMESTAMP - INTERVAL '${dias} days'
            GROUP BY u.id, u.nombre, u.apellido, u.dni
            ORDER BY total_descargas DESC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener usuarios más activos: ${error.message}`);
        }
    }
}

module.exports = Descarga;