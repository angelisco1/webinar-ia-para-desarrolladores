# Análisis SOLID: `web-admin` y `web-shared`

Solo análisis, sin cambios de código. Severidad: **Alta** / **Media** / **Baja**.
Rutas relativas a `packages/`. `web-admin/src/app` se abrevia como `admin/app`.

Contexto general: `web-admin` usa NgModule, componentes `standalone: false`, `HttpClientModule`, interceptor de clase y guard de clase, `any` por todas partes y `subscribe` con callbacks. `web-shared` sí sigue el estilo moderno (signals, `inject`, guards/interceptors funcionales). La duplicación entre ambos (guard e interceptor) es el síntoma más claro de que `web-admin` no usa la abstracción compartida.

---

## SRP: Responsabilidad única

- [ ] **[Alta] `DataService` es un "god service"** — `admin/app/data.service.ts:11-116`
  - Mezcla en una sola clase: HTTP de 4 dominios (restaurantes, platos, ingredientes, empleados), estado global mutable (`restaurants`, `dishes`, `ingredients`, `employees`, `loading`, `currentRestaurantId`), sesión de usuario (`user`, l.21, `isAdmin()` l.98 leyendo `localStorage`), formateo de UI (`formatPrice` l.102, `getCategoryLabel` l.106) y parsing de URL (`getRestaurantIdFromUrl` l.114, con `window.location`).
  - Mezcla además estilos: unos métodos devuelven `Observable` y otros hacen `subscribe` internamente (l.29, l.86); duplica estado (`restaurants` array + `restaurants$`).
  - Sugerencia: dividir en `RestaurantApi`/`DishApi`/`IngredientApi`/`EmployeeApi` (solo HTTP), stores por feature con signals (`DishStore`, etc.), `AuthStore` (ya existe en shared) para usuario/rol, pipes (`priceFormat`, `categoryLabel`) para formato, y leer `restaurantId` desde `ActivatedRoute`/`withComponentInputBinding`.

- [ ] **[Alta] `DishFormComponent` hace demasiado** — `admin/app/components/dish-form/dish-form.component.ts:11-131`
  - Carga ingredientes por HTTP, usa caché del servicio, carga el plato, valida (l.105-112), construye el DTO (l.115-122), gestiona la lista de ingredientes del plato (l.77-98), enfoca el DOM con `setTimeout` + `document.getElementById` (l.63-66), maneja el timeout de errores (l.100) y navega.
  - Sugerencia: extraer validación a una función/validadores de `ReactiveForms`, un sub-componente `dish-ingredients-editor`, un mapper `toDishDto()`, un servicio/directiva de notificaciones (`autofocus` como directiva) y un resolver para cargar datos.

- [ ] **[Alta] `ShellComponent` mezcla layout, datos, sesión y navegación** — `admin/app/components/shell/shell.component.ts:11-74`
  - Carga restaurantes con HTTP directo (l.55), lee usuario de `localStorage` (l.25), decide redirecciones por rol (l.43-50), parsea la URL con regex dos veces (l.28, l.36), gestiona el menú expandido y hace logout manual (l.70-73, duplicando `AuthService.logout()`).
  - Expone una `static instance` (l.13) como mecanismo de comunicación. Además `router.events.subscribe` (l.33) nunca se cancela.
  - Sugerencia: `RestaurantStore` para restaurantes, `AuthStore` para el usuario, un guard/redirect funcional para la redirección por rol, `AuthService.logout()` para salir, `takeUntilDestroyed` o `toSignal(router.events)`.

- [ ] **[Media] Componentes de formulario con validación, mapeo y gestión de errores inline** — `restaurant-form.component.ts:47-87`, `employee-form.component.ts:34-57`, `ingredient-form.component.ts:51-72`
  - Cada uno repite validaciones manuales, construcción del body y extracción de `err.error.message` (l.85, l.55, l.70). Lógica de dominio (reglas de validación) dentro de la UI.
  - Sugerencia: validadores reutilizables o Reactive Forms, un helper `extractApiError(err, fallback)`, mappers a DTO.

- [ ] **[Media] `DishListComponent` mezcla UI, filtrado, mutación de estado y actualización de disponibilidad** — `dish-list/dish-list.component.ts:33-77`
  - `getDishes()` se llama desde la plantilla (recalcula en cada CD y tiene un `console.log`, l.34); `toggleAvailable` reconstruye el DTO completo del plato (l.51-58) y muta el objeto (l.60); usa `alert`/`confirm` directamente; muta `dataService.dishes` desde fuera (l.25, l.70).
  - Sugerencia: `computed()` para el filtro, endpoint/método `setAvailability(id, value)` en el store, servicio de diálogos (`ConfirmService`) en lugar de `confirm/alert`.

- [ ] **[Media] `IngredientListComponent` / `IngredientFormComponent` hacen HTTP directamente y construyen URLs** — `ingredient-list.component.ts:16-42`, `ingredient-form.component.ts:26-72`
  - Duplican `'/api/v1/...'` (hardcode, ignorando el token `API_URL`), parsean `window.location.pathname` (l.19) y en edición descargan todos los ingredientes para buscar uno (l.36-41).
  - Sugerencia: `IngredientApi` + `IngredientStore`; `API_URL` inyectado.

- [ ] **[Media] `AuthStore` también gestiona persistencia** — `web-shared/src/lib/auth/auth.store.ts:3-30`
  - Almacena estado reactivo y además hace I/O a `localStorage` (lecturas en l.5-9, escrituras l.18-19, borrados l.25-26); claves mágicas repetidas en otros sitios.
  - Sugerencia: extraer un `SessionStorage` (ver DIP) y constantes de claves.

- [ ] **[Baja] `AuthService` mezcla login, registro y navegación** — `web-shared/src/lib/auth/auth.service.ts:28-50`
  - `logout()` navega (l.49) y `login`/`register` duplican el mismo flujo; `LoginResponse` está definido localmente y no se exporta.
  - Sugerencia: método privado `authenticate(path, body)`; sacar la navegación a quien llama o a un `NavigationService`.

- [ ] **[Baja] `errorInterceptor` hace tres cosas** — `web-shared/src/lib/http/error.interceptor.ts:9-33`
  - Detecta 401, limpia la sesión, redirige y mantiene un flag de módulo `isRedirecting` con un `setTimeout` de 1 s (estado global a nivel de módulo, difícil de testear).
  - Sugerencia: delegar en `AuthService.handleUnauthorized()` y mover el flag a un servicio.

- [ ] **[Baja] `RestaurantDashboardComponent` obtiene datos de otro componente** — `restaurant-dashboard.component.ts:16-29`
  - Ver también DIP. Además usa `setTimeout(500)` para "esperar" al shell (condición de carrera).

---

## OCP: Abierto/Cerrado

- [ ] **[Media] Categorías de plato con cadena de `if`** — `admin/app/data.service.ts:105-111`
  - Añadir una categoría obliga a editar `getCategoryLabel`, y las listas `categories` se repiten en `dish-form.component.ts:19` y `dish-list.component.ts:17`.
  - Sugerencia: un único mapa `DISH_CATEGORIES: Record<DishCategory, string>` en un modelo compartido y un pipe `categoryLabel`.

- [ ] **[Media] Permisos por rol codificados con condicionales** — `shell.component.html:9,49`, `shell.component.ts:43-50`, `data.service.ts:98`, `employee-list.component.ts:19-25`
  - `user.role == 'admin'` esparcido por plantillas y código; `getRoleBadgeClass` compara contra `'admin'`. Un nuevo rol (o regla) exige tocar varios ficheros.
  - Sugerencia: `Role` como tipo/enum, `AuthStore.hasRole()`/`can('permiso')`, directiva estructural `*appHasRole`, mapa `ROLE_BADGE`, `roleGuard` funcional reutilizable en rutas (`data: { roles }`).

- [ ] **[Media] `saveX(…, id?)` con `if (id) put else post`** — `data.service.ts:45-51`, `64-69`, `ingredient-form.component.ts:64`
  - Un único método decide el comportamiento según un parámetro opcional; patrón repetido, no extensible a otros tipos.
  - Sugerencia: `create()`/`update()` separados o una clase base `CrudApi<T>` genérica con recurso configurable (ver DIP).

- [ ] **[Baja] Navegación del shell cableada en la plantilla** — `shell.component.html` (ítems de menú fijos)
  - Añadir una sección implica editar la plantilla. Sugerencia: definir la navegación como datos (`NavItem[]` con roles requeridos) y renderizarla con `@for`.

- [ ] **[Baja] Validaciones en cadena de `if` secuenciales** — `restaurant-form.component.ts:51-66`, `employee-form.component.ts:36-47`
  - Cada regla nueva es una edición de `save()`. Sugerencia: lista de reglas/validadores componibles.

---

## LSP: Sustitución de Liskov

- [ ] **[Media] `AuthGuard` (clase) y `authGuard` (función) no son intercambiables y divergen en comportamiento** — `admin/app/auth.guard.ts:5-15` vs `web-shared/src/lib/auth/auth.guard.ts:5-11`
  - El de admin lee `localStorage` y navega imperativamente (`return false`); el de shared usa `AuthStore` y devuelve `UrlTree`. Dos implementaciones del "mismo" contrato con semánticas distintas (y el de admin puede desincronizarse del `AuthStore`).
  - Sugerencia: eliminar el de admin y usar `authGuard` de shared.

- [ ] **[Media] `AuthInterceptor` (admin) vs `authInterceptor`/`errorInterceptor` (shared) rompen el contrato esperado por el resto** — `admin/app/auth.interceptor.ts:7-23`
  - Combina adjuntar token y manejo de 401 con `window.location.href`/`localStorage.clear()` (recarga completa y borra TODO el storage), mientras el de shared limpia solo la sesión y usa el router. Sustituir uno por otro cambia efectos observables (estado, historial).
  - Sugerencia: usar los interceptores funcionales de shared con `provideHttpClient(withInterceptors([...]))`.

- [ ] **[Baja] `RestaurantDashboardComponent` exige un `ShellComponent` inyectable** — `restaurant-dashboard.component.ts:16`
  - Inyectar un componente solo funciona si el shell es ancestro en el árbol de inyección; el contrato implícito se rompe si el componente se usa/lazy-load en otro contexto (p. ej. tests o rutas fuera del shell).

- [ ] **[Baja] Subtipos "any" y estados nulos que violan la promesa de tipos** — `data.service.ts:20` (`currentRestaurantId: string = null`), `data.service.ts:21` (`JSON.parse(...)` puede ser `null` y se usa sin comprobar: `shell.component.ts:43` `this.user.role`)
  - Sugerencia: tipos estrictos (`string | null`) y modelos `Restaurant`, `Dish`, `Ingredient`, `Employee`.

---

## ISP: Segregación de interfaces

- [ ] **[Alta] Consumidores dependen de la superficie completa de `DataService`** — `dish-list`, `dish-form`, `employee-list`, `employee-form`, `restaurant-form` inyectan `DataService`
  - `EmployeeListComponent` solo necesita empleados y el id de restaurante, pero recibe y puede tocar todo (platos, ingredientes, usuario, utilidades). `public http` (l.23) además expone el `HttpClient` a terceros (lo usa `shell.component.ts:55`).
  - Sugerencia: servicios/stores por feature con API mínima; hacer `http` privado.

- [ ] **[Media] Modelos anchos o inexistentes (`any`)** — todo `web-admin`; `AuthStore._user` `signal<any>` (`auth.store.ts:8`, `setSession(token, user: any)` l.17)
  - Sin interfaces `Restaurant`/`Dish`/`Ingredient`/`Employee`, cada componente trabaja con objetos completos (p. ej. el formulario de restaurante maneja `ownerFirstName`, `logoUrl` en el mismo objeto de edición y creación). El `LoginResponse.employee` de `auth.service.ts:8-18` (no exportado) es el único modelo tipado.
  - Sugerencia: `models/` por feature con `Dish`, `CreateDishDto`, `UpdateDishDto`, `AuthUser` exportado desde shared.

- [ ] **[Media] `DishFormComponent` maneja un único objeto `dish: any` para edición, UI y DTO** — `dish-form.component.ts:22-29,115-122`
  - Mezcla estado de formulario (`newIngredientId`, `newIngredientQty`) con datos de dominio. Sugerencia: `FormGroup` tipado separado del modelo de dominio.

- [ ] **[Baja] `index.ts` de shared exporta todo** — `web-shared/src/index.ts:1-8`
  - Componentes, store, servicio, guard e interceptores en un único barrel; una app que solo necesita el guard arrastra el resto. Sugerencia: entry points secundarios (`/auth`, `/http`, `/components`) si crece.

---

## DIP: Inversión de dependencias

- [ ] **[Alta] Dependencia directa de `localStorage` en múltiples capas** — `data.service.ts:21,98`, `shell.component.ts:25,71`, `auth.guard.ts:9` (admin), `auth.interceptor.ts:10,17` (admin), `auth.store.ts:5-26`
  - Alto acoplamiento a una API de navegador concreta (rompe SSR/tests) y a las claves `'auth_token'`/`'auth_user'` repetidas como literales; `AuthStore` de shared ya existe pero admin lo ignora.
  - Sugerencia: un token `SESSION_STORAGE` (interfaz `getItem/setItem/removeItem`) con implementación por defecto de `localStorage`, y todo el acceso a sesión vía `AuthStore`.

- [ ] **[Alta] URL de la API hardcodeada en vez de inyectada** — `data.service.ts:6` (`// TODO: mover a environment`), `shell.component.ts:55`, `ingredient-list.component.ts:25,36`, `ingredient-form.component.ts:36,63`; existe `API_URL` (`web-shared/src/lib/tokens.ts`) provisto en `app.module.ts:57`
  - Sugerencia: inyectar `API_URL` en una clase base de API o un `ApiClient`.

- [ ] **[Alta] Componentes acoplados a `HttpClient` y a `window`/`document`** — `ingredient-list.component.ts:16,19`, `ingredient-form.component.ts:26`, `dish-list.component.ts`/`employee-list.component.ts` vía `getRestaurantIdFromUrl()` (`data.service.ts:114`), `dish-form.component.ts:64` (`document.getElementById`), `shell.component.ts:72`/`auth.interceptor.ts:18` (`window.location.href`)
  - Sugerencia: repositorios/APIs inyectables, `ActivatedRoute`/`input()` con `withComponentInputBinding` para params, `Router`/`DOCUMENT` inyectados o directivas.

- [ ] **[Alta] Acoplamiento componente a componente mediante singleton estático** — `shell.component.ts:13,21`, `restaurant-form.component.ts:81` (`ShellComponent.instance.loadRestaurants()`), `restaurant-dashboard.component.ts:3,16` (`private shell: ShellComponent`)
  - Un formulario depende de la implementación concreta del shell y de que esté instanciado; la `static instance` es estado global oculto. El dashboard sondea con `setTimeout(500)` hasta que el shell tenga datos.
  - Sugerencia: `RestaurantStore` (signals) compartido; el shell, el formulario y el dashboard lo consumen y el formulario llama a `store.reload()`/`store.upsert()`.

- [ ] **[Media] Estado mutable público compartido entre componentes** — `data.service.ts:14-20`; mutaciones desde fuera: `dish-form.component.ts:41`, `dish-list.component.ts:25,70`, `employee-form.component.ts:51`, `employee-list.component.ts:15`, `shell.component.ts:57`
  - Los componentes dependen de los detalles internos de almacenamiento del servicio y lo modifican directamente (incluso `dishes.find(...)` como caché en `dish-form.component.ts:46`).
  - Sugerencia: stores con signals privadas expuestas como readonly (convención del proyecto) y métodos de intención.

- [ ] **[Media] `confirm()`/`alert()` nativos en lógica de componentes** — `dish-list.component.ts:62,68,74`, `ingredient-list.component.ts:35,39`
  - Dependencia directa de globales del navegador; difícil de sustituir/testear. Sugerencia: `DialogService`/`NotificationService` inyectable.

- [ ] **[Baja] `AuthService` depende de `Router` concreto para `logout`** — `auth.service.ts:24,49`; `LoginComponent`/`RegisterComponent` navegan a `'/'` fijo (`login.component.ts:28`, `register.component.ts:42`)
  - Sugerencia: token `POST_LOGIN_URL`/`LOGIN_ROUTE` configurable por app.

- [ ] **[Baja] Módulos/`NgModule` y `HttpClientModule` obsoletos con interceptor basado en clase** — `app.module.ts:4,47,58`
  - `provideZoneChangeDetection()` en un proyecto declarado zoneless y `HTTP_INTERCEPTORS` con clase concreta. Sugerencia: bootstrap standalone con `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))` y `provideRouter` + `provide API_URL` (alinea con las otras apps).

---

## Prioridad sugerida

1. Extraer un `RestaurantStore` y eliminar `ShellComponent.instance` / inyección del shell (DIP, SRP).
2. Trocear `DataService` en APIs y stores por feature con modelos tipados (SRP, ISP, DIP).
3. Migrar admin a `authGuard`, `authInterceptor`, `errorInterceptor` y `AuthStore` de `web-shared`; abstraer storage con token (LSP, DIP).
4. Inyectar `API_URL` en vez de URLs literales y centralizar errores de API (DIP).
5. Centralizar categorías y roles en modelos/mapas y pipes/directivas (OCP).
6. Extraer validación y gestión de formularios (Reactive Forms) y servicios de diálogo/notificaciones (SRP).
