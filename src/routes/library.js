const express = require('express');
const Libro = require('../models/Libro');
const Categoria = require('../models/Categoria');
const Comentario = require('../models/Comentario');
const Favorito = require('../models/Favorito');
const { 
    apiAuth, 
    apiMatriculado, 
    optionalAuth 
} = require('../middleware/auth');
const {
    uploadBookFiles,
    handleMulterError,
    getPublicUrl,
    deleteFile,
    formatError,
    formatSuccess,
    validateRequiredFields,
    paginateResults
} = require('../utils/helpers');

const router = express.Router();

// ============= RUTAS PÚBLICAS =============

// Página principal de la biblioteca
router.get('/', optionalAuth, async (req, res) => {
    try {
        const [
            librosPopulares,
            librosMejorCalificados,
            categorias,
            librosMasFavoritados
        ] = await Promise.all([
            Libro.obtenerMasPopulares(6),
            Libro.obtenerMejorCalificados(6),
            Categoria.obtenerTodas(),
            Favorito.obtenerMasFavoritados(6)
        ]);

        res.render('pages/home', {
            pageTitle: 'Inicio',
            activeNav: 'home',
            librosPopulares,
            librosMejorCalificados,
            categorias,
            librosMasFavoritados,
            user: req.user || null,
            isAuthenticated: !!req.user
        });
    } catch (error) {
        console.error('Error cargando biblioteca:', error);
        res.status(500).render('pages/error', {
            pageTitle: 'Error',
            error: 'Error al cargar la biblioteca'
        });
    }
});

// Catálogo de libros con búsqueda y filtros
router.get('/catalog', optionalAuth, async (req, res) => {
    try {
        const {
            busqueda,
            categoria_id,
            autor,
            page = 1,
            limit = 20,
            ordenar = 'fecha_subida',
            direccion = 'DESC'
        } = req.query;

        const { limit: pageSize, offset } = paginateResults(page, limit);

        const filtros = {
            busqueda,
            categoria_id: categoria_id ? parseInt(categoria_id) : null,
            autor,
            limit: pageSize,
            offset,
            ordenar,
            direccion
        };

        const [libros, categorias] = await Promise.all([
            Libro.buscar(filtros),
            Categoria.obtenerTodas()
        ]);

        res.json(formatSuccess({
            libros,
            categorias,
            filtros: {
                busqueda,
                categoria_id,
                autor,
                page: parseInt(page),
                limit: pageSize,
                ordenar,
                direccion
            },
            isAuthenticated: !!req.user,
            user: req.user || null
        }));
    } catch (error) {
        console.error('Error en catálogo:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Obtener detalles de un libro específico
router.get('/books/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [libro, comentarios, promedioCalificacion] = await Promise.all([
            Libro.buscarPorId(parseInt(id)),
            Comentario.obtenerPorLibro(parseInt(id), 10, 0),
            Comentario.obtenerPromedioCalificacion(parseInt(id))
        ]);

        if (!libro) {
            return res.status(404).json(formatError('Libro no encontrado'));
        }

        // Incrementar contador de vistas
        await Libro.incrementarVistas(libro.id);

        // Verificar si está en favoritos del usuario
        let esFavorito = false;
        if (req.user) {
            esFavorito = await Favorito.verificar(req.user.id, libro.id);
        }

        // Obtener comentario del usuario si existe
        let comentarioUsuario = null;
        if (req.user) {
            comentarioUsuario = await Comentario.obtenerPorUsuarioYLibro(req.user.id, libro.id);
        }

        res.json(formatSuccess({
            libro,
            comentarios,
            promedioCalificacion,
            esFavorito,
            comentarioUsuario,
            isAuthenticated: !!req.user,
            user: req.user || null
        }, 'Libro cargado exitosamente'));
    } catch (error) {
        console.error('Error cargando libro:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= RUTAS REQUIEREN AUTENTICACIÓN =============

// Agregar libro a favoritos
router.post('/books/:id/favorite', apiAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const libroId = parseInt(id);

        // Verificar que el libro existe
        const libro = await Libro.buscarPorId(libroId);
        if (!libro) {
            return res.status(404).json(formatError('Libro no encontrado'));
        }

        await Favorito.agregar(req.user.id, libroId);

        res.json(formatSuccess(null, 'Libro agregado a favoritos'));
    } catch (error) {
        console.error('Error agregando a favoritos:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Eliminar libro de favoritos
router.delete('/books/:id/favorite', apiAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const libroId = parseInt(id);

        const eliminado = await Favorito.eliminar(req.user.id, libroId);
        
        if (eliminado) {
            res.json(formatSuccess(null, 'Libro eliminado de favoritos'));
        } else {
            res.status(404).json(formatError('El libro no estaba en favoritos'));
        }
    } catch (error) {
        console.error('Error eliminando de favoritos:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Obtener favoritos del usuario
router.get('/favorites', apiAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { limit: pageSize, offset } = paginateResults(page, limit);

        const [favoritos, total] = await Promise.all([
            Favorito.obtenerPorUsuario(req.user.id, pageSize, offset),
            Favorito.contarPorUsuario(req.user.id)
        ]);

        res.json(formatSuccess({
            favoritos,
            pagination: {
                page,
                limit: pageSize,
                total
            }
        }, 'Favoritos cargados exitosamente'));
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Agregar comentario y calificación a un libro
router.post('/books/:id/comment', apiAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario, calificacion } = req.body;

        const missingFields = validateRequiredFields(['comentario', 'calificacion'], req.body);
        if (missingFields.length > 0) {
            return res.status(400).json(formatError(`Faltan campos requeridos: ${missingFields.join(', ')}`));
        }

        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json(formatError('La calificación debe estar entre 1 y 5'));
        }

        // Verificar que el libro existe
        const libro = await Libro.buscarPorId(parseInt(id));
        if (!libro) {
            return res.status(404).json(formatError('Libro no encontrado'));
        }

        const nuevoComentario = await Comentario.crear({
            usuario_id: req.user.id,
            libro_id: parseInt(id),
            comentario: comentario.trim(),
            calificacion: parseInt(calificacion)
        });

        res.status(201).json(formatSuccess(nuevoComentario, 'Comentario agregado exitosamente'));
    } catch (error) {
        console.error('Error agregando comentario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Actualizar comentario
router.put('/books/:id/comment/:commentId', apiAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { comentario, calificacion } = req.body;

        // Verificar que el comentario pertenece al usuario
        const comentarioExistente = await Comentario.obtenerPorUsuarioYLibro(req.user.id, parseInt(req.params.id));
        if (!comentarioExistente || comentarioExistente.id !== parseInt(commentId)) {
            return res.status(403).json(formatError('No puedes modificar este comentario'));
        }

        const datosActualizados = {};
        if (comentario) datosActualizados.comentario = comentario.trim();
        if (calificacion) {
            if (calificacion < 1 || calificacion > 5) {
                return res.status(400).json(formatError('La calificación debe estar entre 1 y 5'));
            }
            datosActualizados.calificacion = parseInt(calificacion);
        }

        const comentarioActualizado = await Comentario.actualizar(parseInt(commentId), datosActualizados);

        res.json(formatSuccess(comentarioActualizado, 'Comentario actualizado exitosamente'));
    } catch (error) {
        console.error('Error actualizando comentario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Eliminar comentario
router.delete('/books/:id/comment/:commentId', apiAuth, async (req, res) => {
    try {
        const { commentId } = req.params;

        // Verificar que el comentario pertenece al usuario
        const comentarioExistente = await Comentario.obtenerPorUsuarioYLibro(req.user.id, parseInt(req.params.id));
        if (!comentarioExistente || comentarioExistente.id !== parseInt(commentId)) {
            return res.status(403).json(formatError('No puedes eliminar este comentario'));
        }

        const eliminado = await Comentario.eliminar(parseInt(commentId));
        
        if (eliminado) {
            res.json(formatSuccess(null, 'Comentario eliminado exitosamente'));
        } else {
            res.status(404).json(formatError('Comentario no encontrado'));
        }
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= RUTAS REQUIEREN MATRÍCULA ACTIVA =============

// Descargar libro (requiere matrícula activa)
router.get('/books/:id/download', apiMatriculado, async (req, res) => {
    try {
        const { id } = req.params;
        
        const libro = await Libro.buscarPorId(parseInt(id));
        if (!libro) {
            return res.status(404).json(formatError('Libro no encontrado'));
        }

        if (!libro.archivo_url) {
            return res.status(404).json(formatError('El archivo PDF no está disponible'));
        }

        // Incrementar contador de descargas
        await Libro.incrementarDescargas(libro.id);

        // Registrar descarga en la base de datos
        const { Descarga } = require('../models/Descarga');
        await Descarga.registrar(req.user.id, libro.id, req.ip);

        res.json(formatSuccess({
            downloadUrl: libro.archivo_url,
            fileName: libro.archivo_nombre || `${libro.titulo}.pdf`
        }, 'URL de descarga generada'));
    } catch (error) {
        console.error('Error en descarga:', error);
        res.status(500).json(formatError(error.message));
    }
});

// ============= RUTAS DE ADMINISTRACIÓN (SOLO PARA ADMIN) =============

// Subir nuevo libro (solo admin)
router.post('/books/upload', 
    require('passport').authenticate('jwt', { session: false }), // Middleware para verificar admin
    uploadBookFiles, 
    handleMulterError, 
    async (req, res) => {
        try {
            const {
                titulo,
                autor,
                isbn,
                editorial,
                anio_publicacion,
                categoria_id,
                descripcion
            } = req.body;

            const missingFields = validateRequiredFields(['titulo', 'autor', 'categoria_id'], req.body);
            if (missingFields.length > 0) {
                return res.status(400).json(formatError(`Faltan campos requeridos: ${missingFields.join(', ')}`));
            }

            // Procesar archivos subidos
            let archivo_url = null;
            let archivo_nombre = null;
            let archivo_tamanio = null;
            let portada_url = null;

            if (req.files.pdf && req.files.pdf.length > 0) {
                const pdfFile = req.files.pdf[0];
                archivo_url = pdfFile.location;
                archivo_nombre = pdfFile.originalname;
                archivo_tamanio = pdfFile.size;
            }

            if (req.files.portada && req.files.portada.length > 0) {
                const portadaFile = req.files.portada[0];
                portada_url = portadaFile.location;
            }

            const nuevoLibro = await Libro.crear({
                titulo: titulo.trim(),
                autor: autor.trim(),
                isbn: isbn ? isbn.trim() : null,
                editorial: editorial ? editorial.trim() : null,
                anio_publicacion: anio_publicacion ? parseInt(anio_publicacion) : null,
                categoria_id: parseInt(categoria_id),
                descripcion: descripcion ? descripcion.trim() : null,
                archivo_url,
                archivo_nombre,
                archivo_tamanio,
                portada_url,
                subido_por: req.user.id
            });

            res.status(201).json(formatSuccess(nuevoLibro, 'Libro subido exitosamente'));
        } catch (error) {
            console.error('Error subiendo libro:', error);
            res.status(500).json(formatError(error.message));
        }
    }
);

module.exports = router;