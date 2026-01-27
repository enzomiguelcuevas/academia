// Mock Data Adapter - Integración con Sistema Existente
// Este archivo simula las respuestas de los modelos existentes pero usa datos predefinidos

// Configuración de modo demo
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development';

// Imports de datos mock
const librosMock = require('./data/libros.json');
const categoriasMock = require('./data/categorias.json');
const usuariosMock = require('./data/usuarios.json');
const comentariosMock = require('./data/comentarios.json');

class MockDataAdapter {
    
    // Simular respuesta del modelo Libro
    static async buscar(filtros = {}) {
        if (!USE_MOCK_DATA) return null; // Usar modelo real
        
        let resultado = [...librosMock];
        
        // Aplicar filtros exactamente como lo haría el modelo real
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(libro => 
                libro.titulo.toLowerCase().includes(busqueda) ||
                libro.autor.toLowerCase().includes(busqueda) ||
                libro.descripcion.toLowerCase().includes(busqueda)
            );
        }
        
        if (filtros.categoria_id) {
            resultado = resultado.filter(libro => libro.categoria_id === parseInt(filtros.categoria_id));
        }
        
        if (filtros.autor) {
            const autor = filtros.autor.toLowerCase();
            resultado = resultado.filter(libro => libro.autor.toLowerCase().includes(autor));
        }
        
        // Ordenamiento
        const ordenar = filtros.ordenar || 'fecha_subida';
        const direccion = filtros.direccion || 'DESC';
        
        resultado.sort((a, b) => {
            let aVal = a[ordenar];
            let bVal = b[ordenar];
            
            // Manejar casos especiales
            if (ordenar === 'promedio_calificacion') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            }
            
            if (direccion === 'DESC') {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            } else {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
        });
        
        // Paginación
        const limit = parseInt(filtros.limit) || 20;
        const offset = parseInt(filtros.offset) || 0;
        
        return resultado.slice(offset, offset + limit);
    }
    
    // Simular búsqueda por ID
    static async buscarPorId(id) {
        if (!USE_MOCK_DATA) return null;
        
        const libro = librosMock.find(l => l.id === parseInt(id));
        
        if (!libro) return null;
        
        // Agregar datos adicionales como lo haría el modelo real
        return {
            ...libro,
            categoria_nombre: categoriasMock.find(c => c.id === libro.categoria_id)?.nombre || 'Desconocida',
            subido_por_nombre: usuariosMock.find(u => u.id === libro.subido_por)?.nombre || 'Admin'
        };
    }
    
    // Simular obtener más populares
    static async obtenerMasPopulares(limit = 10) {
        if (!USE_MOCK_DATA) return null;
        
        return librosMock
            .sort((a, b) => (b.vistas_count + b.descargas_count) - (a.vistas_count + a.descargas_count))
            .slice(0, limit)
            .map(libro => ({
                ...libro,
                categoria_nombre: categoriasMock.find(c => c.id === libro.categoria_id)?.nombre || 'Desconocida'
            }));
    }
    
    // Simular obtener mejor calificados
    static async obtenerMejorCalificados(limit = 10) {
        if (!USE_MOCK_DATA) return null;
        
        return librosMock
            .filter(l => l.total_comentarios > 0) // Solo libros con comentarios
            .sort((a, b) => (parseFloat(b.promedio_calificacion) || 0) - (parseFloat(a.promedio_calificacion) || 0))
            .slice(0, limit)
            .map(libro => ({
                ...libro,
                categoria_nombre: categoriasMock.find(c => c.id === libro.categoria_id)?.nombre || 'Desconocida'
            }));
    }
    
    // Simular obtener todos los libros (para admin)
    static async obtenerTodos(limit = 50, offset = 0) {
        if (!USE_MOCK_DATA) return null;
        
        return librosMock
            .sort((a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida))
            .slice(offset, offset + limit)
            .map(libro => ({
                ...libro,
                categoria_nombre: categoriasMock.find(c => c.id === libro.categoria_id)?.nombre || 'Desconocida',
                subido_por_nombre: usuariosMock.find(u => u.id === libro.subido_por)?.nombre || 'Admin'
            }));
    }
}

// Simular modelo Categoria
class MockCategoriaAdapter {
    static async obtenerTodas() {
        if (!USE_MOCK_DATA) return null;
        
        return categoriasMock.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    
    static async buscarPorId(id) {
        if (!USE_MOCK_DATA) return null;
        return categoriasMock.find(c => c.id === parseInt(id));
    }
    
    static async crear(datos) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular creación (en un caso real se guardaría en BD)
        const nuevaCategoria = {
            id: Math.max(...categoriasMock.map(c => c.id)) + 1,
            ...datos,
            fecha_creacion: new Date().toISOString()
        };
        
        categoriasMock.push(nuevaCategoria);
        return nuevaCategoria;
    }
}

// Simular modelo Usuario
class MockUsuarioAdapter {
    static async verificarCredenciales(dni) {
        if (!USE_MOCK_DATA) return null;
        
        const usuario = usuariosMock.find(u => u.dni === dni && u.estado);
        
        if (usuario) {
            // Simular búsqueda de contraseña hardcodeada para demo
            return usuario;
        }
        
        return null;
    }
    
    static async buscarPorId(id) {
        if (!USE_MOCK_DATA) return null;
        return usuariosMock.find(u => u.id === parseInt(id));
    }
    
    static async verificarMatriculaActiva(usuarioId) {
        if (!USE_MOCK_DATA) return null;
        
        const usuario = usuariosMock.find(u => u.id === parseInt(usuarioId));
        return usuario?.matricula_activa || false;
    }
    
    static async obtenerMatriculadosActivos() {
        if (!USE_MOCK_DATA) return null;
        
        return usuariosMock
            .filter(u => u.estado && u.matricula_activa)
            .map(u => ({
                ...u,
                fecha_vencimiento: u.fecha_vencimiento_matricula,
                curso: u.curso || 'General'
            }));
    }
    
    static async obtenerTodos(limit = 50, offset = 0) {
        if (!USE_MOCK_DATA) return null;
        
        return usuariosMock
            .filter(u => u.estado)
            .map(({ password_hash, ...usuario }) => usuario) // Excluir contraseña
            .sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro))
            .slice(offset, offset + limit);
    }
}

// Simular modelo Comentario
class MockComentarioAdapter {
    static async obtenerPorLibro(libroId, limit = 20, offset = 0) {
        if (!USE_MOCK_DATA) return null;
        
        return comentariosMock
            .filter(c => c.libro_id === parseInt(libroId) && c.estado === 'activo')
            .sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario))
            .slice(offset, offset + limit)
            .map(comentario => {
                const usuario = usuariosMock.find(u => u.id === comentario.usuario_id);
                return {
                    ...comentario,
                    usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario Eliminado',
                    usuario_pais: usuario?.pais || 'Desconocido',
                    idioma_usuario: usuario?.idioma_preferido || 'es'
                };
            });
    }
    
    static async obtenerPromedioCalificacion(libroId) {
        if (!USE_MOCK_DATA) return null;
        
        const comentarios = comentariosMock.filter(c => c.libro_id === parseInt(libroId) && c.estado === 'activo');
        
        if (comentarios.length === 0) return 0;
        
        const total = comentarios.reduce((sum, c) => sum + c.calificacion, 0);
        return (total / comentarios.length).toFixed(1);
    }
    
    static async obtenerPorUsuarioYLibro(usuarioId, libroId) {
        if (!USE_MOCK_DATA) return null;
        
        return comentariosMock.find(c => 
            c.usuario_id === parseInt(usuarioId) && 
            c.libro_id === parseInt(libroId) && 
            c.estado === 'activo'
        );
    }
    
    static async crear(datos) {
        if (!USE_MOCK_DATA) return null;
        
        const nuevoComentario = {
            id: Math.max(...comentariosMock.map(c => c.id)) + 1,
            ...datos,
            fecha_comentario: new Date().toISOString(),
            estado: 'activo'
        };
        
        comentariosMock.push(nuevoComentario);
        return nuevoComentario;
    }
    
    static async obtenerTodos(limit = 50, offset = 0) {
        if (!USE_MOCK_DATA) return null;
        
        return comentariosMock
            .filter(c => c.estado === 'activo')
            .sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario))
            .slice(offset, offset + limit)
            .map(comentario => {
                const usuario = usuariosMock.find(u => u.id === comentario.usuario_id);
                const libro = librosMock.find(l => l.id === comentario.libro_id);
                return {
                    ...comentario,
                    usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario Eliminado',
                    libro_titulo: libro?.titulo || 'Libro Eliminado'
                };
            });
    }
}

// Simular modelo Favorito
class MockFavoritoAdapter {
    static async obtenerMasFavoritados(limit = 10) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular conteo de favoritos por libro
        const favoritosPorLibro = {};
        
        // Datos simulados de favoritos
        const favoritosSimulados = [
            { libro_id: 1, count: 45 },
            { libro_id: 9, count: 38 },
            { libro_id: 3, count: 32 },
            { libro_id: 12, count: 28 },
            { libro_id: 7, count: 25 },
            { libro_id: 15, count: 22 }
        ];
        
        favoritosSimulados.forEach(fav => {
            favoritosPorLibro[fav.libro_id] = fav.count;
        });
        
        return librosMock
            .filter(l => favoritosPorLibro[l.id])
            .map(libro => ({
                ...libro,
                favoritos_count: favoritosPorLibro[libro.id]
            }))
            .sort((a, b) => b.favoritos_count - a.favoritos_count)
            .slice(0, limit);
    }
    
    static async verificar(usuarioId, libroId) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular verificación de favoritos
        const usuarioFavoritos = {
            1: [1, 3, 7, 12], // Usuario 1 tiene estos libros en favoritos
            2: [9, 15, 21],
            3: [1, 9, 12, 18, 25]
        };
        
        const favoritosUsuario = usuarioFavoritos[usuarioId] || [];
        return favoritosUsuario.includes(parseInt(libroId));
    }
    
    static async agregar(usuarioId, libroId) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular agregar a favoritos
        return { success: true, message: 'Agregado a favoritos' };
    }
    
    static async eliminar(usuarioId, libroId) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular eliminar de favoritos
        return { success: true, message: 'Eliminado de favoritos' };
    }
    
    static async obtenerPorUsuario(usuarioId, limit = 20, offset = 0) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular obtener favoritos de usuario
        const usuarioFavoritos = {
            1: [1, 3, 7, 12],
            2: [9, 15, 21],
            3: [1, 9, 12, 18, 25]
        };
        
        const favoritosIds = usuarioFavoritos[usuarioId] || [];
        
        return librosMock
            .filter(l => favoritosIds.includes(l.id))
            .slice(offset, offset + limit)
            .map((libro, index) => ({
                id: index + 1,
                libro,
                usuario_id: usuarioId,
                fecha_agregado: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            }));
    }
    
    static async contarPorUsuario(usuarioId) {
        if (!USE_MOCK_DATA) return null;
        
        const usuarioFavoritos = {
            1: [1, 3, 7, 12],
            2: [9, 15, 21],
            3: [1, 9, 12, 18, 25]
        };
        
        return usuarioFavoritos[usuarioId]?.length || 0;
    }
}

// Simular modelo Matricula
class MockMatriculaAdapter {
    static async verificarActiva(usuarioId) {
        if (!USE_MOCK_DATA) return null;
        
        const usuario = usuariosMock.find(u => u.id === parseInt(usuarioId));
        return usuario?.matricula_activa || false;
    }
    
    static async obtenerTodos(limit = 50, offset = 0, estado = null) {
        if (!USE_MOCK_DATA) return null;
        
        // Simular datos de matrículas
        const matriculasSimuladas = usuariosMock
            .filter(u => u.estado)
            .map(usuario => ({
                id: usuario.id,
                usuario_id: usuario.id,
                curso: usuario.curso || 'General',
                fecha_matricula: usuario.fecha_registro,
                fecha_vencimiento: usuario.fecha_vencimiento_matricula,
                observaciones: `Matrícula activa para ${usuario.nombre}`,
                estado: usuario.matricula_activa ? 'activa' : 'vencida'
            }));
        
        let resultado = matriculasSimuladas;
        
        if (estado) {
            resultado = resultado.filter(m => m.estado === estado);
        }
        
        return resultado
            .sort((a, b) => new Date(b.fecha_matricula) - new Date(a.fecha_matricula))
            .slice(offset, offset + limit)
            .map(matricula => {
                const usuario = usuariosMock.find(u => u.id === matricula.usuario_id);
                return {
                    ...matricula,
                    usuario_nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario Eliminado',
                    usuario_dni: usuario?.dni || 'N/A',
                    usuario_email: usuario?.email || 'N/A',
                    esta_activa_actualmente: usuario?.matricula_activa || false
                };
            });
    }
    
    static async obtenerPorVencer(dias = 30) {
        if (!USE_MOCK_DATA) return null;
        
        const fechaLimite = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
        
        return usuariosMock
            .filter(u => 
                u.estado && 
                u.matricula_activa && 
                new Date(u.fecha_vencimiento_matricula) <= fechaLimite
            )
            .map(usuario => ({
                id: usuario.id,
                usuario_id: usuario.id,
                curso: usuario.curso || 'General',
                fecha_vencimiento: usuario.fecha_vencimiento_matricula,
                usuario_nombre: `${usuario.nombre} ${usuario.apellido}`,
                usuario_dni: usuario.dni,
                usuario_email: usuario.email
            }));
    }
    
    static async obtenerEstadisticas() {
        if (!USE_MOCK_DATA) return null;
        
        const total = usuariosMock.filter(u => u.estado).length;
        const activas = usuariosMock.filter(u => u.estado && u.matricula_activa).length;
        const vencidas = usuariosMock.filter(u => u.estado && !u.matricula_activa).length;
        const usuariosUnicos = usuariosMock.filter(u => u.estado).length;
        
        return {
            total_matriculas: total,
            activas,
            vencidas,
            canceladas: 0,
            total_usuarios_unicos: usuariosUnicos
        };
    }
}

module.exports = {
    MockDataAdapter,
    MockCategoriaAdapter,
    MockUsuarioAdapter,
    MockComentarioAdapter,
    MockFavoritoAdapter,
    MockMatriculaAdapter,
    USE_MOCK_DATA
};