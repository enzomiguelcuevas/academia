require('dotenv').config(); // <--- ESTA LÍNEA TIENE QUE SER LA PRIMERA
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const { testConnection } = require('./src/config/database');

// Debug rápido: esto te dirá en la consola si está leyendo el .env o no
console.log("DEBUG ENV -> Usuario:", process.env.DB_USER, "Password:", process.env.DB_PASSWORD);

testConnection(); 
const app = express();
// ... resto del código
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    // Agregamos un 'fallback' por si el .env falla
    secret: process.env.SESSION_SECRET || 'clave-secreta-temporal', 
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 
    }

}));
// ... debajo de app.use(session({ ... }));
const passport = require('passport'); // Asegúrate de que esté este require arriba
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Routes
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const libraryRoutes = require('./src/routes/library');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', libraryRoutes);

// Home route
app.get('/', (req, res) => {
    res.redirect('/library');
});

// Start server
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;