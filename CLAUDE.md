# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Resttek: plataforma de gestión de restaurantes. Monorepo con npm workspaces (`packages/*`, Node 22+): una API (`api`, Express 5 + TypeScript + SQLite) y tres apps Angular 21 (`web-admin` :4200, `web-empleados` :4201, `web-clientes` :4202) más la librería `web-shared` (auth, interceptors, componentes comunes). La documentación (en español) está en `docs/arquitectura/` y `docs/dominio/` (glosario, modelo de datos).

## Comandos

Desde la raíz (tras `npm install`):

```bash
npm run dev:api        # API en :3000 con tsx watch (healthcheck: /health, sin prefijo /api/v1)
npm run dev:admin      # también dev:empleados, dev:clientes (ng serve con proxy /api -> :3000)
npm run seed           # datos de prueba (idempotente, INSERT OR IGNORE); la contraseña de cada usuario es su email (ej. admin@resttek.com)
npm test               # tests de la API (vitest run)
```

Un solo test / modo watch (desde `packages/api`):

```bash
npx vitest run src/services/order.service.test.ts
npm run test:watch
```

Los frontends solo tienen `ng build` (`npm run build -w @resttek/web-admin`); no hay tests ni lint configurados. Los cambios en `web-shared` no se recargan en caliente: hay que reiniciar el dev server del frontend.

## Arquitectura de la API (`packages/api`)

Conviven **dos estilos**; identifica cuál aplica antes de tocar código:

- **Hexagonal + DDD**: solo el contexto `src/contexts/employee/` (domain → application → infrastructure/http). `Employee` es la única entidad real (constructor privado + `create()`); casos de uso con `execute()`. `contexts/shared/` contiene `Email`, middlewares y `errorHandler`.
- **Por capas**: `restaurant`, `dish`, `ingredient`, `order` usan carpetas transversales `models/`, `repositories/`, `services/`, `controllers/`, `routes/`. Los modelos son interfaces planas; las validaciones viven en los servicios y en funciones `normalizeX()` de `models/`. La composición de dependencias (repo → service → controller) se hace dentro de cada fichero de rutas (en `employee`, en `infrastructure/http/dependencies.ts`).

Detalles que no se deducen leyendo un solo fichero:

- Imports ESM con extensión `.js` y path aliases (`@models/*`, `@services/*`, `@employee/*`, `@shared/*`, `@config/*`, `@errors/*`...) definidos en `tsconfig.json`; en tests los resuelve `vite-tsconfig-paths`.
- Routers bajo `/restaurants/:restaurantId/...` necesitan `Router({ mergeParams: true })`.
- Errores: `AppError` → `errors/DomainErrors.ts`. El `errorHandler` decide el HTTP por **nombre de clase** (404 para los `*NotFoundError` listados, 401 `InvalidCredentialsError`, resto 400). Los errores nuevos que deban ser 404 hay que añadirlos a esa lista. `OrderController` es la excepción: no usa `next(error)`, hace su propio try/catch.
- Auth: JWT, middlewares `authenticate` / `authorize(roles)` (responden directamente, sin `errorHandler`). Las rutas de pedidos no aplican `authorize`.
- Al crear un pedido, el servicio expande cantidades (quantity 3 → 3 filas `order_items`) para seguir el estado de cada unidad.
- BD: `config/database.ts` exporta una instancia única `dbConfig`; las tablas se crean en `initialize()` con `CREATE TABLE IF NOT EXISTS` (no hay sistema de migraciones). Archivo `packages/api/resttek.db` (git-ignorado); con `NODE_ENV=test` usa `:memory:`. SQL usa alias `snake_case as camelCase`.
- Tests: vitest unitarios junto al código, con dobles en `**/mocks/`. No hay tests HTTP (supertest está instalado pero sin usar).

## Arquitectura del frontend

Angular 21: standalone components, signals, zoneless (sin zone.js), guards/interceptors funcionales. Estado en stores (`providedIn: 'root'` con signals privadas expuestas como readonly) que envuelven HTTP con `firstValueFrom` en `web-admin` y `web-empleados`; `web-clientes` consume Observables con `.subscribe()` directamente. Estructura: `web-admin`/`web-empleados` por feature (`models/ pages/ services/ store/`); `web-clientes` centraliza modelos/servicios/store en `core/`. Ver `docs/arquitectura/arquitectura-frontend.md`.

## Otros

`scripts/seed-issues.sh` crea issues de GitHub desde `scripts/issues.json` (requiere `gh` y `jq`; ver `scripts/README.md`).
