# Logrod Backend

Backend API del proyecto Logrod, construida con Express.js y preparada para servir como punto de entrada principal de la aplicación.

## Descripción

Este proyecto proporciona una base sólida para exponer servicios REST mediante una arquitectura simple y escalable. Actualmente incluye:

- Servidor Express configurado con seguridad básica
- Middleware para manejo de errores y rutas no encontradas
- Endpoint de health check
- Configuración de entorno con variables externas

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clona el repositorio y entra a la carpeta del proyecto.
2. Instala las dependencias:

```bash
npm install
```

3. Copia el archivo de ejemplo de variables de entorno:

```bash
copy .env.example .env
```

4. Ajusta los valores según tu entorno.

## Variables de entorno

El archivo `.env` acepta las siguientes variables:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

- `PORT`: puerto donde correrá la API
- `NODE_ENV`: entorno de ejecución (`development`, `production`, etc.)
- `CORS_ORIGIN`: origen permitido para solicitudes CORS

## Ejecutar el proyecto

### Modo desarrollo

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

## Endpoints disponibles

### Health check

```http
GET /api/v1/health
```

Respuesta de ejemplo:

```json
{
  "success": true,
  "message": "Backend API operando correctamente",
  "timestamp": "2026-07-28T00:00:00.000Z",
  "uptime": 12.34
}
```

## Estructura del proyecto

```text
src/
  app.js
  index.js
  config/
  controllers/
  middlewares/
  routes/
```

## Lanzamiento recomendado

Para lanzar el backend localmente:

```bash
npm install
copy .env.example .env
npm run dev
```

Luego abre en tu navegador o cliente HTTP la siguiente URL:

```text
http://localhost:3000/api/v1/health
```

## Notas

Este README está pensado para el lanzamiento inicial del proyecto y puede ampliarse con documentación adicional de autenticación, base de datos y despliegue cuando se agreguen esos módulos.

