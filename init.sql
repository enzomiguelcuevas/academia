-- Script inicial para la base de datos de biblioteca
-- Este archivo se ejecuta automáticamente cuando el contenedor se inicia por primera vez

-- Crear tablas básicas si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías básicas
INSERT INTO categorias (nombre, descripcion) VALUES 
('Ficción', 'Libros de ficción y novelas'),
('No Ficción', 'Libros de no ficción y ensayos'),
('Técnico', 'Libros técnicos y programación'),
('Académico', 'Libros académicos y de estudio'),
('Otro', 'Otras categorías')
ON CONFLICT DO NOTHING;

-- Tabla de libros
CREATE TABLE IF NOT EXISTS libros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    editorial VARCHAR(255),
    anio_publicacion INTEGER,
    descripcion TEXT,
    categoria_id INTEGER REFERENCES categorias(id),
    archivo_url VARCHAR(500),
    archivo_nombre VARCHAR(255),
    archivo_tamanio BIGINT,
    portada_url VARCHAR(500),
    subido_por INTEGER REFERENCES usuarios(id),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vistas INTEGER DEFAULT 0,
    descargas INTEGER DEFAULT 0
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    libro_id INTEGER REFERENCES libros(id),
    comentario TEXT NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    libro_id INTEGER REFERENCES libros(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, libro_id)
);

-- Tabla de matrículas
CREATE TABLE IF NOT EXISTS matriculas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    activa BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    UNIQUE(usuario_id)
);

-- Tabla de visualizaciones
CREATE TABLE IF NOT EXISTS visualizaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    libro_id INTEGER REFERENCES libros(id),
    fecha_visualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de descargas
CREATE TABLE IF NOT EXISTS descargas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    libro_id INTEGER REFERENCES libros(id),
    ip_address VARCHAR(45),
    fecha_descarga TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear un usuario admin por defecto (contraseña: admin123)
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador', 'admin@biblioteca.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;