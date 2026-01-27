const { db } = require('../config/database');

class Libro {
    // Crear nuevo libro
    static async crear(libroData) {
        const {
            titulo, autor, isbn, editorial, anio_publicacion, categoria_id,
            descripcion, archivo_url, archivo_nombre, archivo_tamanio, portada_url, subido_por
        } = libroData;

        const query = `
            INSERT INTO libros (titulo, autor, isbn, editorial, anio_publicacion, categoria_id,
                descripcion, archivo_url, archivo_nombre, archivo_tamanio, portada_url, subido_por)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        try {
            const result = await db.one(query, [
                titulo, autor, isbn, editorial, anio_publicacion, categoria_id,
                descripcion, archivo_url, archivo_nombre, archivo_tamanio, portada_url, subido_por
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al crear libro: ${error.message}`);
        }
    }

    // Obtener libro por ID
    static async buscarPorId(id) {
        const query = `
            SELECT l.*, c.nombre as categoria_nombre, u.nombre as subido_por_nombre
            FROM libros l
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN usuarios u ON l.subido_por = u.id
            WHERE l.id = $1 AND l.estado = 'disponible'
        `;
        
        try {
            const result = await db.oneOrNone(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar libro: ${error.message}`);
        }
    }

    // Buscar libros con filtros
    static async buscar(filtros = {}) {
        const {
            busqueda, categoria_id, autor, limit = 20, offset = 0, ordenar = 'fecha_subida', direccion = 'DESC'
        } = filtros;

        let query = `
            SELECT l.*, c.nombre as categoria_nombre, u.nombre as subido_por_nombre,
                   COALESCE(CAST(AVG(co.calificacion) AS DECIMAL(10,1)), 0) as promedio_calificacion,
                   COUNT(co.id) as total_comentarios
            FROM libros l
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN usuarios u ON l.subido_por = u.id
            LEFT JOIN comentarios co ON l.id = co.libro_id
            WHERE l.estado = 'disponible'
        `;

        const params = [];
        let paramIndex = 1;

        if (busqueda) {
            query += ` AND (l.titulo ILIKE $${paramIndex} OR l.autor ILIKE $${paramIndex} OR l.descripcion ILIKE $${paramIndex})`;
            params.push(`%${busqueda}%`);
            paramIndex++;
        }

        if (categoria_id) {
            query += ` AND l.categoria_id = $${paramIndex}`;
            params.push(categoria_id);
            paramIndex++;
        }

        if (autor) {
            query += ` AND l.autor ILIKE $${paramIndex}`;
            params.push(`%${autor}%`);
            paramIndex++;
        }

        query += ` GROUP BY l.id, c.nombre, u.nombre ORDER BY l.${ordenar} ${direccion} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        try {
            const result = await db.manyOrNone(query, params);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar libros: ${error.message}`);
        }
    }

    // Obtener todos los libros (admin)
    static async obtenerTodos(limit = 50, offset = 0) {
        const query = `
            SELECT l.*, c.nombre as categoria_nombre, u.nombre as subido_por_nombre
            FROM libros l
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN usuarios u ON l.subido_por = u.id
            ORDER BY l.fecha_subida DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener libros: ${error.message}`);
        }
    }

    // Actualizar libro
    static async actualizar(id, datosActualizados) {
        const fields = Object.keys(datosActualizados);
        const values = Object.values(datosActualizados);
        
        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
            UPDATE libros 
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await db.one(query, [id, ...values]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar libro: ${error.message}`);
        }
    }

    // Eliminar libro (desactivar)
    static async eliminar(id) {
        const query = 'UPDATE libros SET estado = $1 WHERE id = $2';
        try {
            const result = await db.result(query, ['no_disponible', id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar libro: ${error.message}`);
        }
    }

    // Incrementar contador de descargas
    static async incrementarDescargas(id) {
        const query = 'UPDATE libros SET descargas_count = descargas_count + 1 WHERE id = $1';
        try {
            await db.none(query, [id]);
        } catch (error) {
            throw new Error(`Error al incrementar descargas: ${error.message}`);
        }
    }

    // Incrementar contador de vistas
    static async incrementarVistas(id) {
        const query = 'UPDATE libros SET vistas_count = vistas_count + 1 WHERE id = $1';
        try {
            await db.none(query, [id]);
        } catch (error) {
            throw new Error(`Error al incrementar vistas: ${error.message}`);
        }
    }

    // Obtener libros más populares
    static async obtenerMasPopulares(limit = 10) {
        const query = `
            SELECT l.*, c.nombre as categoria_nombre,
                   COALESCE(CAST(AVG(co.calificacion) AS DECIMAL(10,1)), 0) as promedio_calificacion
            FROM libros l
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN comentarios co ON l.id = co.libro_id
            WHERE l.estado = 'disponible'
            GROUP BY l.id, c.nombre
            ORDER BY (l.descargas_count + l.vistas_count) DESC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener libros populares: ${error.message}`);
        }
    }

    // Obtener libros mejor calificados
    static async obtenerMejorCalificados(limit = 10) {
        const query = `
            SELECT l.*, c.nombre as categoria_nombre,
                   COALESCE(CAST(AVG(co.calificacion) AS DECIMAL(10,1)), 0) as promedio_calificacion,
                   COUNT(co.id) as total_comentarios
            FROM libros l
            LEFT JOIN categorias c ON l.categoria_id = c.id
            LEFT JOIN comentarios co ON l.id = co.libro_id
            WHERE l.estado = 'disponible'
            GROUP BY l.id, c.nombre
            HAVING COUNT(co.id) > 0
            ORDER BY promedio_calificacion DESC, total_comentarios DESC
            LIMIT $1
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener libros mejor calificados: ${error.message}`);
        }
    }
}

module.exports = Libro;