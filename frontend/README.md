# Frontend - Biblioteca Digital

Frontend completo para el sistema de gestión de biblioteca desarrollado con React, TypeScript y Tailwind CSS.

## 🚀 Características

- **Autenticación** con JWT y roles (ADMIN/STUDENT)
- **Catálogo de libros** con búsqueda y filtros
- **Panel de administración** para subir libros
- **Tema oscuro/claro** persistente
- **Diseño responsive** para todos los dispositivos
- **TypeScript** para mayor seguridad de tipos
- **Estado global** con Zustand
- **API REST** con Axios

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos modernos
- **Zustand** para manejo de estado
- **React Router** para navegación
- **React Hook Form** para formularios
- **Axios** para consumo de API
- **Lucide React** para iconos

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes UI
│   ├── ui/             # Componentes base
│   ├── layout/         # Layouts
│   └── common/         # Componentes compartidos
├── pages/              # Páginas de la app
│   ├── auth/           # Login y registro
│   ├── books/          # Catálogo y detalles
│   └── admin/          # Panel admin
├── services/           # Servicios API
├── stores/             # Estado global (Zustand)
├── types/              # Tipos TypeScript
├── utils/              # Utilidades
└── hooks/              # Hooks personalizados
```

## 🚦 Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construir para producción:**
   ```bash
   npm run build
   ```

## 🔗 Configuración de API

El frontend se conecta automáticamente al backend en:
- Base URL: `http://localhost:3000/api`
- Login endpoint: `POST /api/auth/login`
- JWT token manejado automáticamente

## 👥 Roles y Permisos

### Estudiantes (STUDENT):
- Ver catálogo de libros
- Buscar y filtrar libros
- Leer libros en línea
- Descargar libros (si está permitido)

### Administradores (ADMIN):
- Todas las funciones de estudiante
- Subir nuevos libros (PDF)
- Gestionar categorías
- Ver estadísticas
- Gestionar usuarios

## 🌙 Tema Oscuro/Claro

- Toggle en el header
- Persistencia en localStorage
- Transiciones suaves
- Diseño adaptativo

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Navegación adaptativa
- Tarjetas responsivas

## 🔐 Autenticación

- Login con DNI y contraseña
- JWT tokens con refresh automático
- Protección de rutas por rol
- Logout automático en token expirado

## 📚 Gestión de Libros

- Upload de archivos PDF
- Metadata (título, autor, descripción)
- Categorización
- Portada opcional
- Control de descarga

## 🎨 UI/UX Features

- Loading states
- Error handling
- Transiciones y animaciones
- Componentes reutilizables
- Accesibilidad

## 🚀 Despliegue

El frontend está configurado para:
- Desarrollo: `npm run dev` (puerto 5173)
- Producción: `npm run build`
- Preview: `npm run preview`

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Preview de producción
- `npm run lint` - Linting del código

## 📝 Notas

- El proxy de desarrollo está configurado para redirigir `/api` a `http://localhost:3000`
- El tema preference se guarda en localStorage
- Los tokens JWT se guardan automáticamente
- Todas las rutas protegidas tienen verificación de autenticación