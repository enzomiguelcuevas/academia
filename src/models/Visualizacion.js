const { db } = require('../config/database');

class Visualizacion {
    // Registrar nueva visualización
    static async registrar(usuario_id, libro_id, ip_address = null) {
        const query = `
            INSERT INTO visualizaciones (usuario_id, libro_id, ip_address)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        
        try {
            const result = await db.one(query, [usuario_id, libro_id, ip_address]);
            return result;
        } catch (error) {
            throw new Error(`Error al registrar visualización: ${error.message}`);
        }
    }

    // Obtener visualizaciones de un usuario
    static async obtenerPorUsuario(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT v.*, l.titulo, l.autor, l.portada_url, v.fecha_visualizacion
            FROM visualizaciones v
            JOIN libros l ON v.libro_id = l.id
            WHERE v.usuario_id = $1
            ORDER BY v.fecha_visualizacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [usuario_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener visualizaciones del usuario: ${error.message}`);
        }
    }

    // Obtener visualizaciones de un libro
    static async obtenerPorLibro(libro_id, limit = 50, offset = 0) {
        const query = `
            SELECT v.*, u.nombre, u.apellido, u.dni, v.fecha_visualizacion
            FROM visualizaciones v
            JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.libro_id = $1
            ORDER BY v.fecha_visualizacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [libro_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener visualizaciones del libro: ${error.message}`);
        }
    }

    // Obtener todas las visualizaciones (admin)
    static async obtenerTodas(limit = 50, offset = 0) {
        const query = `
            SELECT v.*, u.nombre, u.apellido, u.dni, l.titulo, l.autor
            FROM visualizaciones v
            JOIN usuarios u ON v.usuario_id = u.id
            JOIN libros l ON v.libro_id = l.id
            ORDER BY v.fecha_visualizacion DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener visualizaciones: ${error.message}`);
        }
    }

    // Contar visualizaciones de un usuario
    static async contarPorUsuario(usuario_id) {
        const query = 'SELECT COUNT(*) as total FROM visualizaciones WHERE usuario_id = $1';
        
        try {
            const result = await db.one(query, [usuario_id]);
            return parseInt(result.total);
        } catch (error) {
            throw new Error(`Error al contar visualizaciones del usuario: ${error.message}`);
        }
    }

    // Contar visualizaciones de un libro
    static async contarPorLibro(libro_id) {
        const query = 'SELECT COUNT(*) as total FROM visualizaciones WHERE libro_id = $1';
        
        try {
            const result = await db.one(query, [libro_id]);
            return parseInt(result.total);
        } catch (error) {
            throw new Error(`Error al contar visualizaciones del libro: ${error.message}`);
        }
    }

    // Obtener estadísticas de visualizaciones
    static async obtenerEstadisticas() {
        const query = `
            SELECT 
                COUNT(*) as total_visualizaciones,
                COUNT(DISTINCT usuario_id) as usuarios_unicos,
                COUNT(DISTINCT libro_id) as libros_vistos,
                DATE_TRUNC('day', MAX(fecha_visualizacion)) as ultima_visualizacion
            FROM visualizaciones
        `;
        
        try {
            const result = await db.one(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de visualizaciones: ${error.message}`);
        }
    }

    // Obtener visualizaciones por período
    static async obtenerPorPeriodo(fecha_inicio, fecha_fin) {
        const query = `
            SELECT 
                DATE_TRUNC('day', fecha_visualizacion) as fecha,
                COUNT(*) as total_visualizaciones,
                COUNT(DISTINCT usuario_id) as usuarios_unicos
            FROM visualizaciones
            WHERE fecha_visualizacion BETWEEN $1 AND $2
            GROUP BY DATE_TRUNC('day', fecha_visualizacion)
            ORDER BY fecha DESC
        `;
        
        try {
            const result = await db.manyOrNone(query, [fecha_inicio, fecha_fin]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener visualizaciones por período: ${error.message}`);
        }
    }

    // Obtener libros más vistos
    static async obtenerLibrosMasVistos(limit = 10, dias = 30) {
        const query = `
            SELECT 
                l.id,
                l.titulo,
                l.autor,
                l.portada_url,
                COUNT(v.id) as total_visualizaciones,
                COUNT(DISTINCT v.usuario_id) as usuarios_unicos
            FROM libros l
            JOIN visualizaciones v ON l.id = v.libro_id
            WHERE v.fecha_visualizacion >= CURRENT_TIMESTAMP - INTERVAL '${dias} days'
            GROUP BY l.id, l.titulo, l.autor, l.portada_url
            ORDER BY total_visualizaciones DESC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener libros más vistos: ${error.message}`);
        }
    }

    // Obtener usuarios más activos (más visualizaciones)
    static async obtenerUsuariosMasActivos(limit = 10, dias = 30) {
        const query = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.dni,
                COUNT(v.id) as total_visualizaciones,
                COUNT(DISTINCT v.libro_id) as libros_unicos
            FROM usuarios u
            JOIN visualizaciones v ON u.id = v.usuario_id
            WHERE v.fecha_visualizacion >= CURRENT_TIMESTAMP - INTERVAL '${dias} days'
            GROUP BY u.id, u.nombre, u.apellido, u.dni
            ORDER BY total_visualizaciones DESC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener usuarios más activos: ${error.message}`);
        }
    }

    // Limpiar visualizaciones antiguas (mantener solo últimos 6 meses)
    static async limpiarAntiguas(meses = 6) {
        const query = `
            DELETE FROM visualizaciones 
            WHERE fecha_visualizacion < CURRENT_TIMESTAMP - INTERVAL '${meses} months'
        `;
        
        try {
            const result = await db.result(query);
            return result.rowCount;
        } catch (error) {
            throw new Error(`Error al limpiar visualizaciones antiguas: ${error.message}`);
        }
    }

    // Obtener historial de visualizaciones combinado con descargas
    static async obtenerHistorialUsuario(usuario_id, limit = 50, offset = 0) {
        const query = `
            (
                SELECT 
                    'visualizacion' as tipo,
                    v.fecha_visualizacion as fecha,
                    l.titulo,
                    l.autor,
                    l.portada_url,
                    NULL as accion_detalle
                FROM visualizaciones v
                JOIN libros l ON v.libro_id = l.id
                WHERE v.usuario_id = $1
            )
            UNION ALL
            (
                SELECT 
                    'descarga' as tipo,
                    d.fecha_descarga as fecha,
                    l.titulo,
                    l.autor,
                    l.portada_url,
                    'Descarga completada' as accion_detalle
                FROM descargas d
                JOIN libros l ON d.libro_id = l.id
                WHERE d.usuario_id = $1
            )
            ORDER BY fecha DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [usuario_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener historial del usuario: ${error.message}`);
        }
    }
}

module.exports = Visualizacion;