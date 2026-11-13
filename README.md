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
JWT_SECRET=<cadena aleatoria larga>
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://saborpolitecnico.netlify.app
APP_TIMEZONE=America/Guayaquil
```

- `PORT`: puerto donde correrá la API
- `NODE_ENV`: entorno de ejecución (`development`, `production`, etc.)
- `JWT_SECRET`: obligatorio; sin él la API no arranca
- `CORS_ORIGIN`: dominios web permitidos, separados por coma. Vacío: cualquiera en desarrollo y ninguno en producción. La app móvil no lo necesita.
- `APP_TIMEZONE`: zona horaria de la fecha y hora de los pedidos (por defecto `America/Guayaquil`)

Ver `.env.example` para el correo (Brevo/SMTP).

## Versiones y releases

Al fusionar un PR de `develop` en `main`, el workflow `.github/workflows/release.yml`:

1. Corre los tests contra un PostgreSQL temporal. Si fallan, no se publica nada.
2. Calcula la versión a partir de la última etiqueta `vX.Y.Z` (la primera vez usa la de `package.json`).
3. Crea la etiqueta anotada `vX.Y.Z` en el commit fusionado y un GitHub Release con las notas generadas a partir de los PRs.

El nivel del salto se elige con etiquetas (labels) en el PR:

| Label del PR | Resultado (desde v1.2.3) |
|---|---|
| (ninguna) | `v1.2.4` |
| `release:minor` | `v1.3.0` |
| `release:major` | `v2.0.0` |
| `release:skip` | No se publica |

También se puede lanzar a mano en Actions → Release → Run workflow (sobre `main`), eligiendo patch, minor o major. La versión vigente es la última etiqueta de git; el workflow no modifica `package.json` ni hace commits en `main`.

## Base de datos local (desarrollo)

Para trabajar sin Supabase hay un PostgreSQL en `compose.yaml`:

```bash
podman compose up -d        # o: docker compose up -d
```

En `.env`:

```
DATABASE_URL=postgres://logrod:logrod@localhost:5432/logrod
```

Luego crear las tablas y los datos de prueba:

```bash
npx sequelize-cli db:migrate
npm run seed
```

Usuarios del seed: `cliente@logrod.com` / `cliente123`, `admin@logrod.com` / `admin123`, empleados con `empleado123`.
Con una URL que no es de Supabase la conexión va sin SSL.

`JWT_SECRET` es **obligatorio**: sin él el servidor no arranca (ver `.env.example`). En el servidor de producción debe configurarse antes de desplegar.

## Tests

Usan una base aparte, `logrod_test`, que se recrea con las migraciones en cada ejecución:

```bash
podman exec logrod-postgres createdb -U logrod logrod_test   # solo la primera vez
npm test
```

Otra base: `TEST_DATABASE_URL=postgres://.../algo_test npm test` (el nombre debe terminar en `_test`).

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

### Términos y política de datos (LOPDP)

```http
GET /api/v1/legal              # versión vigente y documentos
GET /api/v1/legal/terminos     # términos y condiciones
GET /api/v1/legal/privacidad   # política de protección de datos
```

Públicos, en JSON (`{tipo, titulo, version, secciones: [{titulo, parrafos}]}`); la app los muestra con sus estilos. Los textos están en `src/legal/documentos.js`: al cambiarlos, sube `VERSION_LEGAL`.

El registro (`POST /clientes` sin token de personal) exige `acepta_terminos: true` y `version_legal` igual a la vigente, y guarda `legal_version` y `legal_aceptado_en` en el cliente. Los clientes que crea el personal desde el panel no la llevan.

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

