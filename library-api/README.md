# Library API (Go + Fiber + GORM + S3)

Backend para biblioteca digital con autenticacion por JWT en cookies, roles (ADMIN/STUDENT), catalogo de libros, comentarios jerarquicos y lectura segura via URLs firmadas de S3.

## Stack
- Go + Fiber
- PostgreSQL + GORM
- AWS S3 (upload + presigned URLs)

## Requisitos
- Go 1.25+
- PostgreSQL 15+
- AWS S3 bucket

## Variables de entorno
Crea un archivo `.env` en la raiz:

```env
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=biblioteca_db
DB_PORT=5432
DB_SSLMODE=disable

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=nombre-del-bucket

JWT_SECRET=clave_super_secreta
COOKIE_SECURE=false
COOKIE_SAMESITE=Lax
MAX_REVIEW_DEPTH=3
```

## Ejecutar local
```bash
go mod tidy
go run ./cmd/api/main.go
```

## Ejecutar con Docker
```bash
docker compose up --build
```

## Arquitectura
```
cmd/api/main.go
config/
  config.go
  database.go
internal/
  handlers/
  middleware/
  models/
  repositories/
  routes/
  services/
pkg/utils/
```

## Flujo de lectura segura
1. Usuario autenticado (JWT en cookie).
2. Verifica matricula activa en periodo actual.
3. Genera URL firmada de S3 (15 minutos).

## Endpoints

### Auth
**POST** `/api/auth/register`
```json
{
  "dni": "12345678",
  "full_name": "Juan Perez",
  "password": "123456"
}
```
Response:
```json
{
  "id": 2,
  "dni": "12345678",
  "full_name": "Juan Perez",
  "role": "STUDENT",
  "is_active": true
}
```

**POST** `/api/auth/login`
```json
{
  "dni": "ADMIN_DNI",
  "password": "ADMIN_PASSWORD"
}
```
Response:
```json
{
  "user": {
    "id": 1,
    "dni": "ADMIN_DNI",
    "full_name": "Admin",
    "role": "ADMIN",
    "is_active": true
  }
}
```

**GET** `/api/auth/me`
Response:
```json
{
  "user_id": 1,
  "role": "ADMIN"
}
```

**POST** `/api/auth/logout`
```json
{ "message": "logged out" }
```

### Admin
**POST** `/api/admin/users`
```json
{
  "dni": "78945612",
  "full_name": "Maria Gomez",
  "password": "password123",
  "role": "STUDENT"
}
```

**POST** `/api/admin/categories`
```json
{
  "name": "Matematicas",
  "slug": "matematicas"
}
```

**POST** `/api/admin/periods`
```json
{
  "name": "2026-I",
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "is_current": true
}
```

**PATCH** `/api/admin/periods/:id/current`
```json
{ "message": "current period updated" }
```

**POST** `/api/admin/enrollments`
```json
{
  "user_id": 2,
  "period_id": 1,
  "display_name": "Maria Gomez",
  "avatar_url": "https://example.com/avatar.jpg",
  "career": "Ingenieria",
  "semester": "5",
  "can_access": true
}
```

**GET** `/api/admin/enrollments`
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 2,
      "period_id": 1,
      "display_name": "Maria Gomez",
      "can_access": true
    }
  ]
}
```

**POST** `/api/admin/books` (multipart/form-data)
Campos:
- `title`: "Algebra Lineal"
- `author`: "K. Hoffman"
- `description`: "Texto completo"
- `category_id`: "1"
- `is_downloadable`: "false"
- `cover_url`: "https://example.com/cover.jpg"
- `file`: PDF

Response:
```json
{
  "id": 1,
  "title": "Algebra Lineal",
  "author": "K. Hoffman",
  "cover_url": "https://example.com/cover.jpg",
  "is_downloadable": false,
  "category_id": 1
}
```

### Catalogo
**GET** `/api/categories`
```json
{ "items": [{ "id": 1, "name": "Matematicas", "slug": "matematicas" }] }
```

**GET** `/api/books`
`/api/books?q=algebra` o `/api/books?category_id=1`
```json
{
  "items": [
    {
      "id": 1,
      "title": "Algebra Lineal",
      "author": "K. Hoffman",
      "category": { "id": 1, "name": "Matematicas", "slug": "matematicas" }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**GET** `/api/books/:id`
```json
{
  "id": 1,
  "title": "Algebra Lineal",
  "author": "K. Hoffman",
  "description": "Texto completo",
  "category": { "id": 1, "name": "Matematicas", "slug": "matematicas" }
}
```

### Lectura segura
**GET** `/api/books/:id/read`
```json
{ "url": "https://s3...presigned" }
```

### Comentarios (arbol)
**GET** `/api/books/:id/reviews`
```json
{
  "items": [
    {
      "id": 10,
      "book_id": 1,
      "parent_id": null,
      "user_id": 2,
      "rating": 5,
      "comment": "Excelente libro",
      "display_name": "Maria Gomez",
      "avatar_url": "https://example.com/avatar.jpg",
      "created_at": 1769491200,
      "children": [
        {
          "id": 11,
          "parent_id": 10,
          "user_id": 3,
          "comment": "Totalmente de acuerdo",
          "display_name": "Luis Perez",
          "created_at": 1769492200,
          "children": []
        }
      ]
    }
  ]
}
```

**POST** `/api/books/:id/reviews` (comentario raiz)
```json
{
  "comment": "Excelente libro",
  "rating": 5
}
```

**POST** `/api/books/:id/reviews` (respuesta)
```json
{
  "parent_id": 10,
  "comment": "Totalmente de acuerdo"
}
```

## Docker Compose rapido
El `docker-compose.yml` levanta `db` y `api` juntos. Asegurate de tener `.env`.

```bash
docker compose up --build
```

## Notas
- `COOKIE_SECURE=true` si usas HTTPS.
- `MAX_REVIEW_DEPTH` limita profundidad de comentarios.
