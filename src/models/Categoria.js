const { db } = require('../config/database');

class Categoria {
    // Obtener todas las categorías
    static async obtenerTodas() {
        const query = `
            SELECT c.*, COUNT(l.id) as total_libros
            FROM categorias c
            LEFT JOIN libros l ON c.id = l.categoria_id AND l.estado = 'disponible'
            GROUP BY c.id
            ORDER BY c.nombre
        `;
        
        try {
            const result = await db.manyOrNone(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener categorías: ${error.message}`);
        }
    }

    // Obtener categoría por ID
    static async buscarPorId(id) {
        const query = `
            SELECT c.*, COUNT(l.id) as total_libros
            FROM categorias c
            LEFT JOIN libros l ON c.id = l.categoria_id AND l.estado = 'disponible'
            WHERE c.id = $1
            GROUP BY c.id
        `;
        
        try {
            const result = await db.oneOrNone(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar categoría: ${error.message}`);
        }
    }

    // Crear nueva categoría
    static async crear(categoriaData) {
        const { nombre, descripcion } = categoriaData;
        
        const query = `
            INSERT INTO categorias (nombre, descripcion)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        try {
            const result = await db.one(query, [nombre, descripcion]);
            return result;
        } catch (error) {
            throw new Error(`Error al crear categoría: ${error.message}`);
        }
    }

    // Actualizar categoría
    static async actualizar(id, datosActualizados) {
        const fields = Object.keys(datosActualizados);
        const values = Object.values(datosActualizados);
        
        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
            UPDATE categorias 
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await db.one(query, [id, ...values]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar categoría: ${error.message}`);
        }
    }

    // Eliminar categoría
    static async eliminar(id) {
        // Primero verificar que no hay libros asociados
        const checkQuery = 'SELECT COUNT(*) as count FROM libros WHERE categoria_id = $1 AND estado = $2';
        
        try {
            const checkResult = await db.one(checkQuery, [id, 'disponible']);
            
            if (parseInt(checkResult.count) > 0) {
                throw new Error('No se puede eliminar la categoría porque tiene libros asociados');
            }

            const deleteQuery = 'DELETE FROM categorias WHERE id = $1';
            const result = await db.result(deleteQuery, [id]);
            return result.rowCount > 0;
            
        } catch (error) {
            throw new Error(`Error al eliminar categoría: ${error.message}`);
        }
    }
}

module.exports = Categoria;