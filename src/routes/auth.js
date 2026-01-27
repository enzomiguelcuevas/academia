const express = require('express');
const Usuario = require('../models/Usuario');
const { 
    generateToken, 
    hashPassword, 
    comparePassword, 
    formatError, 
    formatSuccess, 
    validateRegistrationData,
    validateLoginData,
    formatUserResponse
} = require('../utils/helpers');

const router = express.Router();

// Ruta de registro (solo admin puede registrar nuevos usuarios)
router.post('/register', validateRegistrationData, async (req, res) => {
    try {
        const { dni, nombre, apellido, email, telefono, password, rol = 'usuario' } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await Usuario.buscarPorDni(dni);
        if (existingUser) {
            return res.status(400).json(formatError('El DNI ya está registrado'));
        }

        // Hashear contraseña
        const password_hash = await hashPassword(password);

        // Crear usuario
        const newUser = await Usuario.crear({
            dni,
            nombre,
            apellido,
            email,
            telefono,
            password_hash,
            rol
        });

        const userResponse = formatUserResponse(newUser);

        res.status(201).json(formatSuccess(userResponse, 'Usuario registrado exitosamente'));
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Ruta de login
router.post('/login', validateLoginData, async (req, res) => {
    try {
        const { dni, password } = req.body;

        // Verificar credenciales
        const user = await Usuario.verificarCredenciales(dni);
        if (!user) {
            return res.status(401).json(formatError('Credenciales inválidas'));
        }

        // Verificar contraseña
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json(formatError('Credenciales inválidas'));
        }

        // Generar token
        const token = generateToken(user.id);

        // Guardar sesión
        req.session.userId = user.id;
        req.session.userRole = user.rol;

        const userResponse = formatUserResponse(user);

        res.json(formatSuccess({
            user: userResponse,
            token
        }, 'Login exitoso'));
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Ruta de logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json(formatError('Error al cerrar sesión'));
        }
        res.clearCookie('connect.sid');
        res.json(formatSuccess(null, 'Sesión cerrada exitosamente'));
    });
});

// Ruta para verificar token/usuario actual
router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json(formatError('No hay sesión activa'));
        }

        const user = await Usuario.buscarPorId(req.session.userId);
        if (!user || !user.estado) {
            req.session.destroy();
            return res.status(401).json(formatError('Sesión inválida'));
        }

        // Verificar matrícula activa si no es admin
        let matriculaActiva = false;
        if (user.rol !== 'admin') {
            const Matricula = require('../models/Matricula');
            matriculaActiva = await Matricula.verificarActiva(user.id);
        }

        const userResponse = formatUserResponse(user);

        res.json(formatSuccess({
            user: userResponse,
            matriculaActiva,
            isAuthenticated: true
        }, 'Usuario verificado'));
    } catch (error) {
        console.error('Error verificando usuario:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Ruta para cambiar contraseña
router.post('/change-password', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json(formatError('No hay sesión activa'));
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json(formatError('Faltan campos requeridos'));
        }

        if (newPassword.length < 6) {
            return res.status(400).json(formatError('La nueva contraseña debe tener al menos 6 caracteres'));
        }

        // Obtener usuario actual
        const user = await Usuario.buscarPorId(req.session.userId);
        if (!user) {
            return res.status(404).json(formatError('Usuario no encontrado'));
        }

        // Verificar contraseña actual
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json(formatError('Contraseña actual incorrecta'));
        }

        // Hashear nueva contraseña
        const newPasswordHash = await hashPassword(newPassword);

        // Actualizar contraseña
        await Usuario.actualizar(user.id, { password_hash: newPasswordHash });

        res.json(formatSuccess(null, 'Contraseña actualizada exitosamente'));
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json(formatError(error.message));
    }
});

// Ruta para refrescar token
router.post('/refresh', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json(formatError('No hay sesión activa'));
        }

        const user = await Usuario.buscarPorId(req.session.userId);
        if (!user || !user.estado) {
            req.session.destroy();
            return res.status(401).json(formatError('Sesión inválida'));
        }

        // Generar nuevo token
        const token = generateToken(user.id);

        res.json(formatSuccess({
            token
        }, 'Token actualizado'));
    } catch (error) {
        console.error('Error refrescando token:', error);
        res.status(500).json(formatError(error.message));
    }
});

module.exports = router;