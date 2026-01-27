const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Matricula = require('../models/Matricula');

// Middleware para verificar si el usuario está autenticado
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // Si no hay token, verificar si hay sesión
            if (req.session && req.session.userId) {
                const user = await Usuario.buscarPorId(req.session.userId);
                if (user && user.estado) {
                    req.user = user;
                    return next();
                }
            }
            return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Usuario.buscarPorId(decoded.userId);
        
        if (!user || !user.estado) {
            return res.status(401).json({ error: 'Usuario no válido o inactivo' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar si el usuario es administrador
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }

    next();
};

// Middleware para verificar si el usuario tiene matrícula activa
const requireMatriculaActiva = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Acceso denegado' });
        }

        // Los administradores no necesitan matrícula activa
        if (req.user.rol === 'admin') {
            return next();
        }

        const tieneMatricula = await Matricula.verificarActiva(req.user.id);
        
        if (!tieneMatricula) {
            return res.status(403).json({ 
                error: 'Acceso denegado. Debes tener una matrícula activa para acceder a este contenido.' 
            });
        }

        next();
    } catch (error) {
        console.error('Error verificando matrícula:', error);
        return res.status(500).json({ error: 'Error al verificar matrícula' });
    }
};

// Middleware para verificar si el usuario puede acceder a un recurso específico
const requireOwnership = (resourceIdParam = 'id', resourceModel) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Acceso denegado' });
            }

            // Los administradores tienen acceso a todo
            if (req.user.rol === 'admin') {
                return next();
            }

            const resourceId = req.params[resourceIdParam];
            if (!resourceId) {
                return res.status(400).json({ error: 'ID de recurso no proporcionado' });
            }

            // Aquí podrías verificar si el recurso pertenece al usuario
            // Esto depende del modelo específico y la lógica de negocio
            next();
        } catch (error) {
            console.error('Error verificando ownership:', error);
            return res.status(500).json({ error: 'Error al verificar permisos' });
        }
    };
};

// Middleware para roles específicos
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Acceso denegado' });
        }

        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ 
                error: 'Acceso denegado. Se requieren privilegios específicos.' 
            });
        }

        next();
    };
};

// Middleware opcional - si el usuario está autenticado, adjuntar la información
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await Usuario.buscarPorId(decoded.userId);
            
            if (user && user.estado) {
                req.user = user;
            }
        } else if (req.session && req.session.userId) {
            const user = await Usuario.buscarPorId(req.session.userId);
            if (user && user.estado) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Si hay error en la autenticación, continuar sin usuario
        next();
    }
};

// Middleware para API routes que necesita autenticación
const apiAuth = [authenticateToken];
const apiAdmin = [authenticateToken, requireAdmin];
const apiMatriculado = [authenticateToken, requireMatriculaActiva];

module.exports = {
    authenticateToken,
    requireAdmin,
    requireMatriculaActiva,
    requireOwnership,
    requireRole,
    optionalAuth,
    apiAuth,
    apiAdmin,
    apiMatriculado
};