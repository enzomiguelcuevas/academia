const { db } = require('../config/database');

class Usuario {
    // Crear nuevo usuario
    static async crear(usuarioData) {
        const { dni, nombre, apellido, email, telefono, password_hash, rol = 'usuario' } = usuarioData;
        
        const query = `
            INSERT INTO usuarios (dni, nombre, apellido, email, telefono, password_hash, rol)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        try {
            const result = await db.one(query, [dni, nombre, apellido, email, telefono, password_hash, rol]);
            return result;
        } catch (error) {
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    // Buscar usuario por DNI
    static async buscarPorDni(dni) {
        const query = 'SELECT * FROM usuarios WHERE dni = $1';
        try {
            const result = await db.oneOrNone(query, [dni]);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar usuario por DNI: ${error.message}`);
        }
    }

    // Buscar usuario por ID
    static async buscarPorId(id) {
        const query = 'SELECT * FROM usuarios WHERE id = $1';
        try {
            const result = await db.oneOrNone(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar usuario por ID: ${error.message}`);
        }
    }

    // Verificar credenciales de login
    static async verificarCredenciales(dni, password) {
        const query = 'SELECT * FROM usuarios WHERE dni = $1 AND estado = true';
        try {
            const result = await db.oneOrNone(query, [dni]);
            return result;
        } catch (error) {
            throw new Error(`Error al verificar credenciales: ${error.message}`);
        }
    }

    // Obtener todos los usuarios (admin)
    static async obtenerTodos(limit = 50, offset = 0) {
        const query = `
            SELECT id, dni, nombre, apellido, email, telefono, rol, fecha_registro, estado
            FROM usuarios 
            ORDER BY fecha_registro DESC
            LIMIT $1 OFFSET $2
        `;
        try {
            const result = await db.manyOrNone(query, [limit, offset]);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    // Actualizar usuario
    static async actualizar(id, datosActualizados) {
        const fields = Object.keys(datosActualizados);
        const values = Object.values(datosActualizados);
        
        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
            UPDATE usuarios 
            SET ${setClause}, fecha_registro = fecha_registro
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await db.one(query, [id, ...values]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
    }

    // Eliminar usuario (desactivar)
    static async eliminar(id) {
        const query = 'UPDATE usuarios SET estado = false WHERE id = $1';
        try {
            const result = await db.result(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }

    // Obtener usuarios matriculados activos
    static async obtenerMatriculadosActivos() {
        const query = `
            SELECT u.*, m.fecha_vencimiento, m.curso
            FROM usuarios u
            JOIN matriculas m ON u.id = m.usuario_id
            WHERE m.estado = 'activa' 
            AND m.fecha_vencimiento > CURRENT_TIMESTAMP
            ORDER BY u.nombre, u.apellido
        `;
        
        try {
            const result = await db.manyOrNone(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener usuarios matriculados: ${error.message}`);
        }
    }

    // Verificar si usuario está matriculado activo
    static async verificarMatriculaActiva(usuarioId) {
        const query = `
            SELECT COUNT(*) as count
            FROM matriculas 
            WHERE usuario_id = $1 
            AND estado = 'activa' 
            AND fecha_vencimiento > CURRENT_TIMESTAMP
        `;
        
        try {
            const result = await db.one(query, [usuarioId]);
            return result.count > 0;
        } catch (error) {
            throw new Error(`Error al verificar matrícula: ${error.message}`);
        }
    }
}

module.exports = Usuario;