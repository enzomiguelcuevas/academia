const express = require('express');
const Usuario = require('../models/Usuario');
const Matricula = require('../models/Matricula');
const Libro = require('../models/Libro');
const Categoria = require('../models/Categoria');
const Comentario = require('../models/Comentario');
const Favorito = require('../models/Favorito');
const { apiAdmin } = require('../middleware/auth');
const { 
    hashPassword, 
    formatError, 
    formatSuccess,
    validateRegistrationData,
    validateRequiredFields,
    paginateResults
} = require('../utils/helpers');

const router = express.Router();

// Middleware para todas las rutas de admin
router.use(apiAdmin);

// ============= DASHBOARD =============

// Obtener estadísticas del dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalUsuarios,
            totalLibros,
            matriculasStats,
            usuariosMatriculados
        ] = await Promise.all([
            Usuario.obtenerTodos(1, 0).then(r => r.length),
            Libro.obtenerTodos(1, 0).then(r => r.length),
            Matricula.obtenerEstadisticas(),
            Usuario.obtenerMatriculadosActivos().then(r => r.length)
        ]);

        // Obtener libros más populares
        const librosPopulares = await Libro.obtenerMasPopulares(5);
        
        // Obtener matrículas próximas a vencer
        const matriculasPorVencer = await Matricula.obtenerPorVencer(7);

        res.json(formatSuccess({
            totalUsuarios,
            totalLibros,
            totalMatriculas: matriculasStats.total_matriculas,
            matriculasActivas: matriculasStats.activas,
            usuariosMatriculados,
            librosPopulares,
            matriculasPorVencer: matriculasPorVencer.length
        }, 'Dashboard cargado exitosamente'));
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= GESTIÓN DE USUARIOS =============

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { limit: pageSize, offset } = paginateResults(page, limit);

        const usuarios = await Usuario.obtenerTodos(pageSize, offset);
        
        res.json(formatSuccess({
            usuarios,
            pagination: {
                page,
                limit: pageSize,
                total: usuarios.length
            }
        }));
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Crear nuevo usuario
router.post('/users', validateRegistrationData, async (req, res) => {
    try {
        const { password, ...userData } = req.body;
        const password_hash = await hashPassword(password);

        const newUser = await Usuario.crear({ ...userData, password_hash });
        
        res.status(201).json(formatSuccess(newUser, 'Usuario creado exitosamente'));
    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Actualizar usuario
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;

        // Si se está actualizando la contraseña, hashearla
        if (datosActualizados.password) {
            datosActualizados.password_hash = await hashPassword(datosActualizados.password);
            delete datosActualizados.password;
        }

        const updatedUser = await Usuario.actualizar(parseInt(id), datosActualizados);
        
        res.json(formatSuccess(updatedUser, 'Usuario actualizado exitosamente'));
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Eliminar (desactivar) usuario
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Usuario.eliminar(parseInt(id));
        
        if (deleted) {
            res.json(formatSuccess(null, 'Usuario eliminado exitosamente'));
        } else {
            res.status(404).json(formatError('Usuario no encontrado'));
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= GESTIÓN DE MATRÍCULAS =============

// Obtener todas las matrículas
router.get('/matriculas', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const estado = req.query.estado || null;
        const { limit: pageSize, offset } = paginateResults(page, limit);

        const matriculas = await Matricula.obtenerTodos(pageSize, offset, estado);
        
        res.json(formatSuccess({
            matriculas,
            pagination: {
                page,
                limit: pageSize,
                total: matriculas.length
            }
        }));
    } catch (error) {
        console.error('Error obteniendo matrículas:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Crear nueva matrícula
router.post('/matriculas', async (req, res) => {
    try {
        const { usuario_id, curso, fecha_vencimiento, observaciones } = req.body;
        
        const missingFields = validateRequiredFields(['usuario_id', 'curso', 'fecha_vencimiento'], req.body);
        if (missingFields.length > 0) {
            return res.status(400).json(formatError(`Faltan campos requeridos: ${missingFields.join(', ')}`));
        }

        const newMatricula = await Matricula.crear({
            usuario_id: parseInt(usuario_id),
            curso,
            fecha_vencimiento,
            observaciones
        });
        
        res.status(201).json(formatSuccess(newMatricula, 'Matrícula creada exitosamente'));
    } catch (error) {
        console.error('Error creando matrícula:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Actualizar matrícula
router.put('/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMatricula = await Matricula.actualizar(parseInt(id), req.body);
        
        res.json(formatSuccess(updatedMatricula, 'Matrícula actualizada exitosamente'));
    } catch (error) {
        console.error('Error actualizando matrícula:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Desactivar matrícula
router.delete('/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deactivated = await Matricula.desactivar(parseInt(id));
        
        if (deactivated) {
            res.json(formatSuccess(null, 'Matrícula desactivada exitosamente'));
        } else {
            res.status(404).json(formatError('Matrícula no encontrada'));
        }
    } catch (error) {
        console.error('Error desactivando matrícula:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= GESTIÓN DE LIBROS =============

// Obtener todos los libros
router.get('/books', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { limit: pageSize, offset } = paginateResults(page, limit);

        const libros = await Libro.obtenerTodos(pageSize, offset);
        
        res.json(formatSuccess({
            libros,
            pagination: {
                page,
                limit: pageSize,
                total: libros.length
            }
        }));
    } catch (error) {
        console.error('Error obteniendo libros:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Actualizar libro
router.put('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBook = await Libro.actualizar(parseInt(id), req.body);
        
        res.json(formatSuccess(updatedBook, 'Libro actualizado exitosamente'));
    } catch (error) {
        console.error('Error actualizando libro:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Eliminar (desactivar) libro
router.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Libro.eliminar(parseInt(id));
        
        if (deleted) {
            res.json(formatSuccess(null, 'Libro eliminado exitosamente'));
        } else {
            res.status(404).json(formatError('Libro no encontrado'));
        }
    } catch (error) {
        console.error('Error eliminando libro:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= GESTIÓN DE CATEGORÍAS =============

// Obtener todas las categorías
router.get('/categories', async (req, res) => {
    try {
        const categorias = await Categoria.obtenerTodas();
        res.json(formatSuccess(categorias));
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Crear nueva categoría
router.post('/categories', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        
        const missingFields = validateRequiredFields(['nombre'], req.body);
        if (missingFields.length > 0) {
            return res.status(400).json(formatError(`Faltan campos requeridos: ${missingFields.join(', ')}`));
        }

        const newCategory = await Categoria.crear({ nombre, descripcion });
        
        res.status(201).json(formatSuccess(newCategory, 'Categoría creada exitosamente'));
    } catch (error) {
        console.error('Error creando categoría:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Actualizar categoría
router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCategory = await Categoria.actualizar(parseInt(id), req.body);
        
        res.json(formatSuccess(updatedCategory, 'Categoría actualizada exitosamente'));
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Eliminar categoría
router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Categoria.eliminar(parseInt(id));
        
        if (deleted) {
            res.json(formatSuccess(null, 'Categoría eliminada exitosamente'));
        } else {
            res.status(404).json(formatError('Categoría no encontrada'));
        }
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= GESTIÓN DE COMENTARIOS =============

// Obtener todos los comentarios
router.get('/comments', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const { limit: pageSize, offset } = paginateResults(page, limit);

        const comentarios = await Comentario.obtenerTodos(pageSize, offset);
        
        res.json(formatSuccess({
            comentarios,
            pagination: {
                page,
                limit: pageSize,
                total: comentarios.length
            }
        }));
    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Eliminar comentario
router.delete('/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Comentario.eliminar(parseInt(id));
        
        if (deleted) {
            res.json(formatSuccess(null, 'Comentario eliminado exitosamente'));
        } else {
            res.status(404).json(formatError('Comentario no encontrado'));
        }
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json(formatError(error.message));
    }
});

module.exports = router;