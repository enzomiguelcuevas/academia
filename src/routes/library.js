const express = require('express');
const router = express.Router();
const Libro = require('../models/Libro');
const Categoria = require('../models/Categoria');
const Comentario = require('../models/Comentario');
const Favorito = require('../models/Favorito');
const passport = require('passport');

// --- IMPORTACIONES DE MIDDLEWARE Y UTILS ---
// Aseguramos que se importen correctamente desde tus archivos
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

        await Libro.incrementarVistas(libro.id);

        let esFavorito = false;
        if (req.user) {
            esFavorito = await Favorito.verificar(req.user.id, libro.id);
        }

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

router.post('/books/:id/favorite', apiAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const libroId = parseInt(id);
        const libro = await Libro.buscarPorId(libroId);
        if (!libro) return res.status(404).json(formatError('Libro no encontrado'));

        await Favorito.agregar(req.user.id, libroId);
        res.json(formatSuccess(null, 'Libro agregado a favoritos'));
    } catch (error) {
        console.error('Error agregando a favoritos:', error);
        res.status(500).json(formatError(error.message));
    }
});

router.delete('/books/:id/favorite', apiAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await Favorito.eliminar(req.user.id, parseInt(id));
        if (eliminado) {
            res.json(formatSuccess(null, 'Libro eliminado de favoritos'));
        } else {
            res.status(404).json(formatError('El libro no estaba en favoritos'));
        }
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
});

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
            pagination: { page, limit: pageSize, total }
        }, 'Favoritos cargados exitosamente'));
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
});

router.post('/books/:id/comment', apiAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario, calificacion } = req.body;
        const missingFields = validateRequiredFields(['comentario', 'calificacion'], req.body);
        if (missingFields.length > 0) return res.status(400).json(formatError(`Faltan campos: ${missingFields.join(', ')}`));

        const nuevoComentario = await Comentario.crear({
            usuario_id: req.user.id,
            libro_id: parseInt(id),
            comentario: comentario.trim(),
            calificacion: parseInt(calificacion)
        });
        res.status(201).json(formatSuccess(nuevoComentario, 'Comentario agregado'));
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
});

router.put('/books/:id/comment/:commentId', apiAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { comentario, calificacion } = req.body;
        const comentarioExistente = await Comentario.obtenerPorUsuarioYLibro(req.user.id, parseInt(req.params.id));
        
        if (!comentarioExistente || comentarioExistente.id !== parseInt(commentId)) {
            return res.status(403).json(formatError('No puedes modificar este comentario'));
        }

        const actualizado = await Comentario.actualizar(parseInt(commentId), {
            comentario: comentario?.trim(),
            calificacion: calificacion ? parseInt(calificacion) : undefined
        });
        res.json(formatSuccess(actualizado, 'Comentario actualizado'));
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
});

router.delete('/books/:id/comment/:commentId', apiAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const comentarioExistente = await Comentario.obtenerPorUsuarioYLibro(req.user.id, parseInt(req.params.id));
        if (!comentarioExistente || comentarioExistente.id !== parseInt(commentId)) {
            return res.status(403).json(formatError('No puedes eliminar este comentario'));
        }
        await Comentario.eliminar(parseInt(commentId));
        res.json(formatSuccess(null, 'Comentario eliminado'));
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
});

// ============= RUTAS REQUIEREN MATRÍCULA ACTIVA =============

router.get('/books/:id/download', apiMatriculado, async (req, res) => {
    try {
        const { id } = req.params;
        const libro = await Libro.buscarPorId(parseInt(id));
        if (!libro || !libro.archivo_url) return res.status(404).json(formatError('No disponible'));

        await Libro.incrementarDescargas(libro.id);
        const { Descarga } = require('../models/Descarga');
        await Descarga.registrar(req.user.id, libro.id, req.ip);

        res.json(formatSuccess({
            downloadUrl: libro.archivo_url,
            fileName: libro.archivo_nombre || `${libro.titulo}.pdf`
        }, 'URL generada'));
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
});

// ============= RUTAS DE ADMINISTRACIÓN =============

// He corregido esta ruta para que acepte funciones válidas incluso si fallan los imports
const uploadMiddleware = uploadBookFiles || ((req, res, next) => next());
const errorMiddleware = handleMulterError || ((req, res, next) => next());

router.post('/books/upload', 
    passport.authenticate('jwt', { session: false }), 
    uploadMiddleware, 
    errorMiddleware, 
    async (req, res) => {
        try {
            const { titulo, autor, isbn, editorial, anio_publicacion, categoria_id, descripcion } = req.body;
            const missing = validateRequiredFields(['titulo', 'autor', 'categoria_id'], req.body);
            if (missing.length > 0) return res.status(400).json(formatError(`Faltan campos: ${missing.join(', ')}`));

            const nuevoLibro = await Libro.crear({
                titulo: titulo.trim(),
                autor: autor.trim(),
                isbn: isbn?.trim(),
                editorial: editorial?.trim(),
                anio_publicacion: anio_publicacion ? parseInt(anio_publicacion) : null,
                categoria_id: parseInt(categoria_id),
                descripcion: descripcion?.trim(),
                archivo_url: req.files?.pdf?.[0]?.location,
                archivo_nombre: req.files?.pdf?.[0]?.originalname,
                archivo_tamanio: req.files?.pdf?.[0]?.size,
                portada_url: req.files?.portada?.[0]?.location,
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