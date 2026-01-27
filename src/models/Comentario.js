const { db } = require('../config/database');

class Comentario {
    // Crear nuevo comentario
    static async crear(comentarioData) {
        const { usuario_id, libro_id, comentario, calificacion } = comentarioData;
        
        const query = `
            INSERT INTO comentarios (usuario_id, libro_id, comentario, calificacion)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (usuario_id, libro_id) 
            DO UPDATE SET 
                comentario = EXCLUDED.comentario,
                calificacion = EXCLUDED.calificacion,
                fecha_comentario = CURRENT_TIMESTAMP
            RETURNING *
        `;
        
        try {
            const result = await db.one(query, [usuario_id, libro_id, comentario, calificacion]);
            return result;
        } catch (error) {
            throw new Error(`Error al crear comentario: ${error.message}`);
        }
    }

    // Obtener comentarios de un libro
    static async obtenerPorLibro(libro_id, limit = 20, offset = 0) {
        const query = `
            SELECT c.*, u.nombre, u.apellido, u.dni
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.libro_id = $1
            ORDER BY c.fecha_comentario DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [libro_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener comentarios del libro: ${error.message}`);
        }
    }

    // Obtener comentario de usuario para un libro
    static async obtenerPorUsuarioYLibro(usuario_id, libro_id) {
        const query = `
            SELECT c.*, u.nombre, u.apellido, u.dni
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.usuario_id = $1 AND c.libro_id = $2
        `;
        
        try {
            const result = await db.oneOrNone(query, [usuario_id, libro_id]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener comentario del usuario: ${error.message}`);
        }
    }

    // Actualizar comentario
    static async actualizar(id, datosActualizados) {
        const fields = Object.keys(datosActualizados);
        const values = Object.values(datosActualizados);
        
        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
            UPDATE comentarios 
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await db.one(query, [id, ...values]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar comentario: ${error.message}`);
        }
    }

    // Eliminar comentario
    static async eliminar(id) {
        const query = 'DELETE FROM comentarios WHERE id = $1';
        try {
            const result = await db.result(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar comentario: ${error.message}`);
        }
    }

    // Obtener promedio de calificaciones de un libro
    static async obtenerPromedioCalificacion(libro_id) {
        const query = `
            SELECT 
                COALESCE(AVG(calificacion), 0) as promedio,
                COUNT(*) as total_comentarios,
                COUNT(CASE WHEN calificacion = 5 THEN 1 END) as cinco_estrellas,
                COUNT(CASE WHEN calificacion = 4 THEN 1 END) as cuatro_estrellas,
                COUNT(CASE WHEN calificacion = 3 THEN 1 END) as tres_estrellas,
                COUNT(CASE WHEN calificacion = 2 THEN 1 END) as dos_estrellas,
                COUNT(CASE WHEN calificacion = 1 THEN 1 END) as una_estrella
            FROM comentarios
            WHERE libro_id = $1
        `;
        
        try {
            const result = await db.one(query, [libro_id]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener promedio de calificaciones: ${error.message}`);
        }
    }

    // Obtener comentarios de un usuario
    static async obtenerPorUsuario(usuario_id, limit = 20, offset = 0) {
        const query = `
            SELECT c.*, l.titulo, l.autor, l.portada_url
            FROM comentarios c
            JOIN libros l ON c.libro_id = l.id
            WHERE c.usuario_id = $1
            ORDER BY c.fecha_comentario DESC
            LIMIT $2 OFFSET $3
        `;
        
        try {
            const result = await db.manyOrNone(query, [usuario_id, limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener comentarios del usuario: ${error.message}`);
        }
    }

    // Obtener todos los comentarios (admin)
    static async obtenerTodos(limit = 50, offset = 0) {
        const query = `
            SELECT c.*, u.nombre, u.apellido, u.dni, l.titulo, l.autor
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            JOIN libros l ON c.libro_id = l.id
            ORDER BY c.fecha_comentario DESC
            LIMIT $1 OFFSET $2
        `;
        
        try {
            const result = await db.manyOrNone(query, [limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener comentarios: ${error.message}`);
        }
    }
}

module.exports = Comentario;