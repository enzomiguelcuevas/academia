const { db } = require('../config/database');

class Matricula {
    // Crear nueva matrícula
    static async crear(matriculaData) {
        const { usuario_id, curso, fecha_vencimiento, observaciones } = matriculaData;
        
        // Primero desactivar matrículas anteriores del mismo usuario
        await this.desactivarAnteriores(usuario_id);
        
        const query = `
            INSERT INTO matriculas (usuario_id, curso, fecha_vencimiento, observaciones, estado)
            VALUES ($1, $2, $3, $4, 'activa')
            RETURNING *
        `;
        
        try {
            const result = await db.one(query, [usuario_id, curso, fecha_vencimiento, observaciones]);
            return result;
        } catch (error) {
            throw new Error(`Error al crear matrícula: ${error.message}`);
        }
    }

    // Obtener matrícula por ID
    static async buscarPorId(id) {
        const query = `
            SELECT m.*, u.nombre, u.apellido, u.dni, u.email
            FROM matriculas m
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.id = $1
        `;
        
        try {
            const result = await db.oneOrNone(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar matrícula: ${error.message}`);
        }
    }

    // Obtener matrícula de usuario
    static async buscarPorUsuario(usuario_id) {
        const query = `
            SELECT m.*, 
                   CASE 
                       WHEN m.fecha_vencimiento > CURRENT_TIMESTAMP AND m.estado = 'activa' THEN true 
                       ELSE false 
                   END as esta_activa
            FROM matriculas m
            WHERE m.usuario_id = $1
            ORDER BY m.fecha_matricula DESC
        `;
        
        try {
            const result = await db.manyOrNone(query, [usuario_id]);
            return result;
        } catch (error) {
            throw new Error(`Error al buscar matrículas del usuario: ${error.message}`);
        }
    }

    // Verificar si usuario tiene matrícula activa
    static async verificarActiva(usuario_id) {
        const query = `
            SELECT COUNT(*) as count
            FROM matriculas 
            WHERE usuario_id = $1 
            AND estado = 'activa' 
            AND fecha_vencimiento > CURRENT_TIMESTAMP
        `;
        
        try {
            const result = await db.one(query, [usuario_id]);
            return parseInt(result.count) > 0;
        } catch (error) {
            throw new Error(`Error al verificar matrícula activa: ${error.message}`);
        }
    }

    // Actualizar matrícula
    static async actualizar(id, datosActualizados) {
        const fields = Object.keys(datosActualizados);
        const values = Object.values(datosActualizados);
        
        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const query = `
            UPDATE matriculas 
            SET ${setClause}
            WHERE id = $1
            RETURNING *
        `;

        try {
            const result = await db.one(query, [id, ...values]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar matrícula: ${error.message}`);
        }
    }

    // Desactivar matrícula
    static async desactivar(id) {
        const query = 'UPDATE matriculas SET estado = $1 WHERE id = $2';
        try {
            const result = await db.result(query, ['cancelada', id]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Error al desactivar matrícula: ${error.message}`);
        }
    }

    // Desactivar matrículas anteriores de un usuario
    static async desactivarAnteriores(usuario_id) {
        const query = `
            UPDATE matriculas 
            SET estado = 'vencida' 
            WHERE usuario_id = $1 AND estado = 'activa'
        `;
        
        try {
            await db.none(query, [usuario_id]);
        } catch (error) {
            throw new Error(`Error al desactivar matrículas anteriores: ${error.message}`);
        }
    }

    // Obtener todas las matrículas (admin)
    static async obtenerTodos(limit = 50, offset = 0, estado = null) {
        let query = `
            SELECT m.*, u.nombre, u.apellido, u.dni, u.email,
                   CASE 
                       WHEN m.fecha_vencimiento > CURRENT_TIMESTAMP AND m.estado = 'activa' THEN true 
                       ELSE false 
                   END as esta_activa_actualmente
            FROM matriculas m
            JOIN usuarios u ON m.usuario_id = u.id
        `;

        const params = [];
        let paramIndex = 1;

        if (estado) {
            query += ` WHERE m.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        query += ` ORDER BY m.fecha_matricula DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        try {
            const result = await db.manyOrNone(query, params);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener matrículas: ${error.message}`);
        }
    }

    // Obtener matrículas próximas a vencer
    static async obtenerPorVencer(dias = 30) {
        const query = `
            SELECT m.*, u.nombre, u.apellido, u.dni, u.email
            FROM matriculas m
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.estado = 'activa' 
            AND m.fecha_vencimiento BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '${dias} days'
            ORDER BY m.fecha_vencimiento ASC
        `;
        
        try {
            const result = await db.manyOrNone(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener matrículas por vencer: ${error.message}`);
        }
    }

    // Obtener estadísticas de matrículas
    static async obtenerEstadisticas() {
        const query = `
            SELECT 
                COUNT(*) as total_matriculas,
                COUNT(CASE WHEN estado = 'activa' AND fecha_vencimiento > CURRENT_TIMESTAMP THEN 1 END) as activas,
                COUNT(CASE WHEN estado = 'vencida' OR (estado = 'activa' AND fecha_vencimiento <= CURRENT_TIMESTAMP) THEN 1 END) as vencidas,
                COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
                COUNT(DISTINCT usuario_id) as total_usuarios_unicos
            FROM matriculas
        `;
        
        try {
            const result = await db.one(query);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener estadísticas de matrículas: ${error.message}`);
        }
    }
}

module.exports = Matricula;