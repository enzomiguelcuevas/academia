const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

// Generar token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Hashear contraseña
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Comparar contraseña
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Validar formato de DNI
const validateDNI = (dni) => {
    // Validar formato de DNI peruano (8 dígitos)
    const dniRegex = /^[0-9]{8}$/;
    return dniRegex.test(dni);
};

// Validar formato de email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validar contraseña
const validatePassword = (password) => {
    // Mínimo 6 caracteres
    return password && password.length >= 6;
};

// Sanitizar entrada
const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Eliminar espacios en blanco al inicio y final
    return input.trim();
};

// Formatear respuesta de error
const formatError = (message, statusCode = 500) => {
    return {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };
};

// Formatear respuesta de éxito
const formatSuccess = (data = null, message = 'Operación exitosa') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

// Validar campos requeridos
const validateRequiredFields = (fields, data) => {
    const missingFields = [];
    
    for (const field of fields) {
        if (!data[field] || data[field] === '') {
            missingFields.push(field);
        }
    }
    
    return missingFields;
};

// Paginar resultados
const paginateResults = (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    return { limit: parseInt(limit), offset };
};

// Formatear información de usuario para respuesta (sin datos sensibles)
const formatUserResponse = (user) => {
    if (!user) return null;
    
    const { password_hash, ...userResponse } = user;
    return userResponse;
};

// Middleware para manejar errores globales
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Error de validación de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json(formatError('Token inválido'));
    }
    
    // Error de token expirado
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json(formatError('Token expirado'));
    }
    
    // Error de base de datos
    if (err.code && err.code.startsWith('23')) {
        return res.status(400).json(formatError('Error de restricción de base de datos'));
    }
    
    // Error genérico
    res.status(500).json(formatError('Error interno del servidor'));
};

// Middleware para validar datos de registro
const validateRegistrationData = (req, res, next) => {
    const { dni, nombre, apellido, email, password } = req.body;
    
    // Validar campos requeridos
    const missingFields = validateRequiredFields(['dni', 'nombre', 'apellido', 'password'], req.body);
    if (missingFields.length > 0) {
        return res.status(400).json(formatError(`Faltan campos requeridos: ${missingFields.join(', ')}`));
    }
    
    // Validar formato DNI
    if (!validateDNI(dni)) {
        return res.status(400).json(formatError('Formato de DNI inválido (deben ser 8 dígitos)'));
    }
    
    // Validar email si se proporciona
    if (email && !validateEmail(email)) {
        return res.status(400).json(formatError('Formato de email inválido'));
    }
    
    // Validar contraseña
    if (!validatePassword(password)) {
        return res.status(400).json(formatError('La contraseña debe tener al menos 6 caracteres'));
    }
    
    // Sanitizar datos
    req.body.dni = sanitizeInput(dni);
    req.body.nombre = sanitizeInput(nombre);
    req.body.apellido = sanitizeInput(apellido);
    req.body.email = email ? sanitizeInput(email) : null;
    
    next();
};

// Middleware para validar datos de login
const validateLoginData = (req, res, next) => {
    const { dni, password } = req.body;
    
    // Validar campos requeridos
    const missingFields = validateRequiredFields(['dni', 'password'], req.body);
    if (missingFields.length > 0) {
        return res.status(400).json(formatError(`Faltan campos requeridos: ${missingFields.join(', ')}`));
    }
    
    // Validar formato DNI
    if (!validateDNI(dni)) {
        return res.status(400).json(formatError('Formato de DNI inválido'));
    }
    
    // Sanitizar datos
    req.body.dni = sanitizeInput(dni);
    
    next();
};

module.exports = {
    generateToken,
    hashPassword,
    comparePassword,
    validateDNI,
    validateEmail,
    validatePassword,
    sanitizeInput,
    formatError,
    formatSuccess,
    validateRequiredFields,
    paginateResults,
    formatUserResponse,
    errorHandler,
    validateRegistrationData,
    validateLoginData
};