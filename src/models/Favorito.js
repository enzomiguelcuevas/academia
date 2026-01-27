const { db } = require('../config/database');

class Favorito {
    // Agregar libro a favoritos
    static async agregar(usuario_id, libro_id) {
        const query = `
            INSERT INTO favoritos (usuario_id, libro_id)
            VALUES ($1, $2)
            ON CONFLICT (usuario_id, libro_id) DO NOTHING
            RETURNING *
        `;
        
        try {
            const result = await db.oneOrNone(query, [usuario_id, libro_id]);
            return result;
        } catch (error) {
            throw new Error(`Error al agregar a favoritos: ${error.message}`);
        }
    }

    // Eliminar libro de favoritos
    static async eliminar(usuario_id, libro_id) {
        const query = 'DELETE FROM favoritos WHERE usuario_id = $1 AND libro_id = $2';
        try {
            const result = await db.result(query, [usuario_id, libro_id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar de favoritos: ${error.message}`);
        }
    }

    // Verificar si un libro está en favoritos de un usuario
    static async verificar(usuario_id, libro_id) {
        const query = 'SELECT COUNT(*) as count FROM favoritos WHERE usuario_id = $1 AND libro_id = $2';
        try {
            const result = await db.one(query, [usuario_id, libro_id]);
            return parseInt(result.count) > 0;
        } catch (error) {
            throw new Error(`Error al verificar favorito: ${error.message}`);
        }
    }

    // Obtener favoritos de un usuario
    static async obtenerPorUsuario(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT f.*, l.*, c.nombre as categoria_nombre,
                   COALESCE(CAST(AVG(co.calificacion) AS DECIMAL(10,1)), 0) as promedio_calificacion
            FROM favoritos f
            JOIN libros l ON f.libro_id = l.id
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN comentarios co ON l.id = co.libro_id
            WHERE f.usuario_id = $1 AND l.estado = 'disponible'
            GROUP BY f.id, l.id, c.nombre
            ORDER BY f.fecha_agregado DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [usuario_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener favoritos del usuario: ${error.message}`);
        }
    }

    // Contar favoritos de un usuario
    static async contarPorUsuario(usuario_id) {
        const query = `
            SELECT COUNT(*) as total
            FROM favoritos f
            JOIN libros l ON f.libro_id = l.id
            WHERE f.usuario_id = $1 AND l.estado = 'disponible'
        `;
        
        try {
            const result = await db.one(query, [usuario_id]);
            return parseInt(result.total);
        } catch (error) {
            throw new Error(`Error al contar favoritos: ${error.message}`);
        }
    }

    // Obtener usuarios que favoritaron un libro
    static async obtenerPorLibro(libro_id, limit = 20, offset = 0) {
        const query = `
            SELECT f.*, u.nombre, u.apellido, u.dni, f.fecha_agregado
            FROM favoritos f
            JOIN usuarios u ON f.usuario_id = u.id
            WHERE f.libro_id = $1 AND u.estado = true
            ORDER BY f.fecha_agregado DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [libro_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener usuarios que favoritaron el libro: ${error.message}`);
        }
    }

    // Contar cuántos usuarios favoritaron un libro
    static async contarPorLibro(libro_id) {
        const query = `
            SELECT COUNT(*) as total
            FROM favoritos f
            JOIN usuarios u ON f.usuario_id = u.id
            WHERE f.libro_id = $1 AND u.estado = true
        `;
        
        try {
            const result = await db.one(query, [libro_id]);
            return parseInt(result.total);
        } catch (error) {
            throw new Error(`Error al contar favoritos del libro: ${error.message}`);
        }
    }

    // Obtener libros más favoritados
    static async obtenerMasFavoritados(limit = 10) {
        const query = `
            SELECT l.*, COUNT(f.id) as total_favoritos,
                   c.nombre as categoria_nombre,
                   COALESCE(CAST(AVG(co.calificacion) AS DECIMAL(10,1)), 0) as promedio_calificacion
            FROM libros l
            JOIN favoritos f ON l.id = f.libro_id
            JOIN usuarios u ON f.usuario_id = u.id
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN comentarios co ON l.id = co.libro_id
            WHERE l.estado = 'disponible' AND u.estado = true
            GROUP BY l.id, c.nombre
            ORDER BY total_favoritos DESC, l.titulo ASC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener libros más favoritados: ${error.message}`);
        }
    }

    // Obtener estadísticas generales de favoritos
    static async obtenerEstadisticas() {
        const query = `
            SELECT 
                COUNT(*) as total_favoritos,
                COUNT(DISTINCT usuario_id) as usuarios_con_favoritos,
                COUNT(DISTINCT libro_id) as libros_favoritados,
                AVG(CAST(cntfavoritos.libro_count AS NUMERIC)) as promedio_favoritos_por_libro
            FROM favoritos f
            CROSS JOIN (
                SELECT libro_id, COUNT(*) as libro_count
                FROM favoritos
                GROUP BY libro_id
            ) cntfavoritos ON f.libro_id = cntfavoritos.libro_id
        `;
        
        try {
            const result = await db.one(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de favoritos: ${error.message}`);
        }
    }

    // Limpiar favoritos de usuarios inactivos o libros no disponibles
    static async limpiar() {
        const query = `
            DELETE FROM favoritos 
            WHERE usuario_id NOT IN (SELECT id FROM usuarios WHERE estado = true)
            OR libro_id NOT IN (SELECT id FROM libros WHERE estado = 'disponible')
        `;
        
        try {
            const result = await db.result(query);
            return result.rowCount;
        } catch (error) {
            throw new Error(`Error al limpiar favoritos: ${error.message}`);
        }
    }
}

module.exports = Favorito;