-- Base de datos para Biblioteca Virtual
-- PostgreSQL Schema

-- Crear base de datos
-- CREATE DATABASE biblioteca;

-- Tabla de Categorías de Libros
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT true
);

-- Tabla de Matrículas de Academia
CREATE TABLE IF NOT EXISTS matriculas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    curso VARCHAR(100) NOT NULL,
    fecha_matricula TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'cancelada')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Libros
CREATE TABLE IF NOT EXISTS libros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    editorial VARCHAR(100),
    anio_publicacion INTEGER,
    categoria_id INTEGER REFERENCES categorias(id),
    descripcion TEXT,
    archivo_url VARCHAR(500), -- URL del archivo en S3
    archivo_nombre VARCHAR(255),
    archivo_tamanio BIGINT,
    portada_url VARCHAR(500), -- URL de la portada en S3
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por INTEGER REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'no_disponible')),
    descargas_count INTEGER DEFAULT 0,
    vistas_count INTEGER DEFAULT 0
);

-- Tabla de Favoritos de Usuario
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    libro_id INTEGER REFERENCES libros(id) ON DELETE CASCADE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, libro_id)
);

-- Tabla de Comentarios y Calificaciones
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    libro_id INTEGER REFERENCES libros(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    fecha_comentario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, libro_id)
);

-- Tabla de Historial de Descargas
CREATE TABLE IF NOT EXISTS descargas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    libro_id INTEGER REFERENCES libros(id) ON DELETE CASCADE,
    fecha_descarga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Tabla de Historial de Visualizaciones
CREATE TABLE IF NOT EXISTS visualizaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    libro_id INTEGER REFERENCES libros(id) ON DELETE CASCADE,
    fecha_visualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Insertar categorías iniciales
INSERT INTO categorias (nombre, descripcion) VALUES 
('Programación', 'Libros sobre desarrollo de software y programación'),
('Ciencias', 'Libros de ciencias naturales y aplicadas'),
('Literatura', 'Obras literarias y clásicos'),
('Historia', 'Libros sobre historia y civilizaciones'),
('Matemáticas', 'Libros de matemáticas y estadística'),
('Negocios', 'Libros sobre administración y negocios'),
('Tecnología', 'Libros sobre tecnología y computación'),
('Idiomas', 'Libros para aprender diferentes idiomas'),
('Arte', 'Libros sobre arte, diseño y creatividad'),
('Filosofía', 'Libros filosóficos y pensamiento')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar usuario administrador inicial
-- Contraseña: admin123 (hashed con bcrypt)
INSERT INTO usuarios (dni, nombre, apellido, email, password_hash, rol) VALUES 
('00000000', 'Administrador', 'Sistema', 'admin@biblioteca.com', '$2a$10$K8ZpDrjWZQV3YkJp9pA.ZO3f/X4jHk3h5X2fX9aJcDk/v8K.YZqW6', 'admin')
ON CONFLICT (dni) DO NOTHING;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_libros_categoria ON libros(categoria_id);
CREATE INDEX IF NOT EXISTS idx_libros_titulo ON libros(titulo);
CREATE INDEX IF NOT EXISTS idx_libros_autor ON libros(autor);
CREATE INDEX IF NOT EXISTS idx_usuarios_dni ON usuarios(dni);
CREATE INDEX IF NOT EXISTS idx_matriculas_usuario ON matriculas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_estado ON matriculas(estado);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_libro ON favoritos(libro_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_libro ON comentarios(libro_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario ON comentarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_descargas_usuario ON descargas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_visualizaciones_usuario ON visualizaciones(usuario_id);

-- Crear vista para usuarios matriculados activos
CREATE VIEW usuarios_matriculados_activos AS
SELECT DISTINCT u.* 
FROM usuarios u
JOIN matriculas m ON u.id = m.usuario_id
WHERE m.estado = 'activa' AND m.fecha_vencimiento > CURRENT_TIMESTAMP;