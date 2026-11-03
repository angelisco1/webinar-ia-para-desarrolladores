# Plan: Trocear `DataService` (god service) y sanear los componentes de platos

- **Issue**: #2
- **Tipo**: feature (refactor, sin cambio de comportamiento visible)
- **Fecha**: 2026-11-03
- **Estado**: pendiente

## 1. Contexto y objetivo

`TODOS/solid.md` (análisis SOLID de `web-admin`) marca como severidad **Alta** que `packages/web-admin/src/app/data.service.ts` es un "god service" y que `DishFormComponent` hace demasiado; en severidad **Media**, que `DishListComponent` mezcla UI, filtrado y mutación de estado. Esta issue cubre:

1. **Eliminar `DataService`**, repartiendo sus responsabilidades en: APIs solo-HTTP por recurso, stores con signals, pipes de formato y un modelo único de categorías.
2. **Rehacer `DishListComponent` y `DishFormComponent`** sobre esas piezas (tipados, sin `any`, sin `window`/`document`/`confirm`/`alert` directos, sin lógica de dominio en la UI).
3. **Migrar el resto de consumidores de `DataService`** (`restaurant-list`, `restaurant-form`, `employee-list`, `employee-form`, `shell`), porque no se puede borrar el servicio mientras alguien lo use.

Comportamiento esperado: idéntico al actual para el usuario (mismas pantallas, mismos mensajes, mismas llamadas HTTP). Es un refactor; la red de seguridad son los tests nuevos.

## 2. Alcance

**Incluye**

- Modelos tipados (`Dish`, `DishIngredient`, `DishCategory`, `DISH_CATEGORIES`, `DishDto`, `Restaurant`, `Ingredient`, `Employee`) en `packages/web-admin/src/app/models/`.
- `RestaurantApi`, `DishApi`, `IngredientApi`, `EmployeeApi` (solo HTTP, usan el token `API_URL`, `create`/`update` separados).
- `RestaurantStore`, `DishStore`, `EmployeeStore` (signals privadas expuestas `readonly`, convención del proyecto).
- Pipes `categoryLabel` y `priceFormat`.
- Servicio `DialogService` (envuelve `confirm`/`alert`) y helper `extractApiError`.
- Directiva `autofocus` y subcomponente `dish-ingredients-editor`; validación y mapeo del formulario de platos como funciones puras.
- Configuración de tests unitarios en `web-admin` (hoy no hay ninguno).
- Obtener el `restaurantId` desde `ActivatedRoute` en vez de `window.location`.
- Eliminar `DataService` y actualizar documentación.

**No incluye**

- `IngredientListComponent` / `IngredientFormComponent` (siguen con `HttpClient` directo; ya están en otro punto de `solid.md`). Solo se crea `IngredientApi` porque `DishForm` necesita cargar ingredientes; los dos componentes de ingredientes se migrarán en otra issue.
- `ShellComponent`: solo se cambia su carga de restaurantes (usar `RestaurantStore`). Su `static instance`, lectura de `localStorage`, redirecciones por rol y logout quedan para otra issue. Idem `RestaurantDashboardComponent` (inyección del shell).
- Migrar `AuthGuard`/`AuthInterceptor`/`AuthStore` de `web-shared`, NgModule → standalone, `HttpClientModule` → `provideHttpClient`.
- Reactive Forms (se mantiene `ngModel`) y el `setTimeout` del mensaje de error transitorio de `DishForm`.
- Roles (`isAdmin`, `user`): no tienen usos fuera de `DataService` (comprobado con grep), se eliminan sin sustituto.
- Tests E2E (los cubre el plan #1).

## 3. Análisis del código actual

- `packages/web-admin/src/app/data.service.ts` (116 l.): `providedIn: 'root'`, `API = '/api/v1'` hardcodeado, estado público mutable (`restaurants`, `restaurants$`, `dishes`, `ingredients`, `employees`, `loading`, `currentRestaurantId`, `user`), `public http`, métodos HTTP de 4 dominios (algunos devuelven `Observable`, `getRestaurants()` y `getEmployees()` hacen `subscribe` dentro), `saveRestaurant`/`saveDish` con `if (id) put else post`, y utilidades: `isAdmin`, `formatPrice` (`parseFloat(price).toFixed(2) + ' €'`), `getCategoryLabel` (cadena de `if`), `getRestaurantIdFromUrl` (`window.location.pathname.split('/')[2]`).
- Consumidores de `DataService` (grep):
  - `components/dish-list/*` y `components/dish-form/*` (foco de la issue).
  - `components/restaurant-list/*`: `dataService.getRestaurants()`, `.loading`, `.restaurants` en plantilla.
  - `components/restaurant-form/restaurant-form.component.ts:36,78`: `getRestaurant(id)`, `saveRestaurant(body, id)`.
  - `components/employee-list/*`: `.employees = []`, `getEmployees(getRestaurantIdFromUrl())`, plantilla usa `dataService.currentRestaurantId` y `.employees`.
  - `components/employee-form/employee-form.component.ts:30,49,51`: `currentRestaurantId || getRestaurantIdFromUrl()`, `createEmployee`, `employees.push(res)`.
  - `components/shell/shell.component.ts:20,55-57`: `dataService.http.get('/api/v1/restaurants')` y escribe `dataService.restaurants`.
- `DishListComponent` (`components/dish-list/dish-list.component.ts`): `getDishes()` se llama desde la plantilla (3 veces por ciclo) y tiene `console.log`; `toggleAvailable` reconstruye el DTO y muta `dish.available`; `deleteDish` usa `confirm`/`alert` y reasigna `dataService.dishes`; `categories` duplicado; la plantilla usa `dataService.getCategoryLabel` / `formatPrice`.
- `DishFormComponent` (`components/dish-form/dish-form.component.ts`): `dish: any` mezcla datos y estado de UI (`newIngredientId`, `newIngredientQty` van aparte pero en el mismo componente); carga ingredientes y plato (con caché en `dataService.dishes`), valida (`name`, `price > 0`), construye el DTO (`price: parseFloat(...)`), gestiona ingredientes (evita duplicados por `ingredientId`), `document.getElementById('dish-name').focus()` con `setTimeout(300)`, `showError` con `setTimeout(3000)`, extrae `err.error.message`, navega a `/restaurants/:id/dishes`. La plantilla conserva `id="dish-name"` (lo usará el plan #1).
- `app.module.ts`: NgModule con componentes `standalone: false`, `provideZoneChangeDetection()`, `{ provide: API_URL, useValue: '/api/v1' }` ya provisto. `API_URL` se exporta de `@resttek/web-shared` (`packages/web-shared/src/lib/tokens.ts`).
- Backend (`packages/api/src/models/dish.model.ts`, `routes/dish.routes.ts`): `Dish { id, name, description: string|null, price: number, category: 'entrante'|'principal'|'postre'|'bebida', available, restaurantId, ingredients: {ingredientId, quantity}[], createdAt, updatedAt }`. Solo existen `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`: **no hay PATCH**, así que cambiar la disponibilidad sigue siendo un `PUT` con el DTO completo.
- Tests: `web-admin` no tiene ni target `test` en `angular.json`, ni vitest/jsdom en `package.json` (`node_modules` no está instalado en este entorno; hay que correr `npm install` antes). `tsconfig.spec.json` no existe.
- Conflicto con plan #1: ese plan (T8-T16) también modifica `dish-form.component.html/.ts`. Hay que ejecutarlos en serie (recomendado: este primero) o reconciliar la plantilla al fusionar.

## 4. Diseño de la solución

Estructura nueva en `packages/web-admin/src/app/` (organizado por feature, como indica `docs/arquitectura/arquitectura-frontend.md`, pero sin romper el NgModule actual):

```
models/            dish.model.ts, restaurant.model.ts, ingredient.model.ts, employee.model.ts
api/               restaurant.api.ts, dish.api.ts, ingredient.api.ts, employee.api.ts   (solo HTTP)
store/             restaurant.store.ts, dish.store.ts, employee.store.ts                 (signals)
shared/            category-label.pipe.ts, price-format.pipe.ts, dialog.service.ts,
                   api-error.ts, autofocus.directive.ts
components/dish-form/  dish-form.mapper.ts, dish-form.validation.ts,
                       dish-ingredients.ts (funciones puras), dish-ingredients-editor/*
```

**Modelos.** `DISH_CATEGORIES: Record<DishCategory, string> = { entrante: 'Entrante', principal: 'Principal', postre: 'Postre', bebida: 'Bebida' }` es la única fuente de categorías (OCP): lista de chips = `Object.keys`, etiqueta = lookup. `Dish`, `DishIngredient`, `DishDto` (`Omit<Dish, 'id'|'restaurantId'|'createdAt'|'updatedAt'>`) reflejan el backend. `Restaurant {id, name}` e `Ingredient {id, name, unit}` solo con campos usados hoy; `Employee` con `id` y el resto como índice abierto hasta que se tipe en otra issue (no se afirma ninguna forma que no se haya leído en `employee-*`).

**APIs.** `@Injectable({ providedIn: 'root' })`, `inject(HttpClient)` y `inject(API_URL)`; devuelven `Observable<T>` y no guardan estado. `DishApi`: `list(restaurantId)`, `get(restaurantId, id)`, `create(restaurantId, dto)`, `update(restaurantId, id, dto)`, `remove(restaurantId, id)`. Análogamente `RestaurantApi` (`list/get/create/update`), `IngredientApi` (`list(restaurantId)`), `EmployeeApi` (`list(restaurantId)`, `create(employee)`).

**Stores.** `providedIn: 'root'`, `inject(Api)`, signals privadas + `asReadonly()` + métodos de intención que envuelven el `Observable` con `firstValueFrom` (convención de `web-admin`). `DishStore`: `dishes`, `loading`, `error`, `load(restaurantId)`, `findById(restaurantId, id)` (la caché que antes era `dataService.dishes.find`, ahora solo acierta si el `restaurantId` coincide con el cargado), `save(restaurantId, dto, id?)`, `setAvailability(restaurantId, dish, available)` (construye el DTO con el mapper y hace `PUT`; actualiza el plato en la señal de forma inmutable), `remove(restaurantId, id)`. `RestaurantStore`: `restaurants`, `loading`, `load()`. `EmployeeStore`: `employees`, `load(restaurantId)` (vacía antes de cargar, como hoy), `add(employee)`.

**Pipes.** `categoryLabel` (usa `DISH_CATEGORIES`, devuelve el valor tal cual si no existe) y `priceFormat` (`parseFloat(v).toFixed(2) + ' €'`, mismo resultado que hoy). Se declaran en `AppModule`.

**Dish list.** Entrada de ruta: `ActivatedRoute.snapshot.paramMap.get('restaurantId')`. Estado: `filter = signal('todos')`, `filteredDishes = computed(...)` (sin `console.log`), `categories = ['todos', ...Object.keys(DISH_CATEGORIES)]`. `toggleAvailable` → `store.setAvailability`; `deleteDish` → `dialog.confirm(...)` y `store.remove`; errores vía `dialog.alert`. El mensaje "Plato eliminado" se conserva con `setTimeout` de 2 s.

**Dish form.** `DishFormComponent` solo orquesta: carga (ingredientes con `IngredientApi`, plato con `store.findById` o `DishApi.get`), enlaza el formulario y navega. Lo demás se extrae:
- `dish-form.validation.ts`: `validateDishForm(value): { name?: true; price?: true }` (misma regla: nombre obligatorio, `price` numérico > 0).
- `dish-form.mapper.ts`: `toDishDto(value: DishFormValue): DishDto` (`price: parseFloat`). Se reutiliza en `DishStore.setAvailability`.
- `dish-ingredients.ts`: `addIngredient(list, ingredientId, quantity)` (ignora duplicados y cantidades ≤ 0, devuelve lista nueva) y `removeIngredient(list, ingredientId)`; `ingredientLabel(all, id)`.
- `DishIngredientsEditorComponent` (`app-dish-ingredients-editor`, `standalone: false`, declarado en `AppModule`): `input` `all: Ingredient[]`, `input` `selected: DishIngredient[]`, `output` `selectedChange`. Contiene `newIngredientId`/`newIngredientQty`, el `<select>` y las chips; conserva las clases CSS actuales (se mueven los estilos de ingredientes al CSS del subcomponente).
- `autofocus.directive.ts` (`[appAutofocus]`): hace `focus()` sobre `ElementRef` al inicializarse, sin `document.getElementById`. Se aplica en el input `#dish-name` solo si se crea un plato (conserva `id="dish-name"`). Nota: hoy el foco se aplica con 300 ms de retraso aunque se edite; la directiva lo aplica al crear el elemento (mismo resultado visible, sin condición de carrera con el `setTimeout`).
- `DishFormValue`: `{ name; description: string|null; price: string|number; category; available; ingredients: DishIngredient[] }`, separado del DTO.

**`DialogService`.** `confirm(message): boolean` y `alert(message): void` sobre `inject(DOCUMENT).defaultView`; mismo UX nativo, pero sustituible en tests (DIP).

**`extractApiError(err, fallback)`.** `err?.error?.message ?? fallback`, usado por `DishForm` (y reutilizable por los demás formularios en otra issue).

**Alternativas descartadas.** (a) Dejar `DataService` como fachada delegando en los stores: mantiene el acoplamiento y la superficie ancha (ISP). (b) Migrar ya a Reactive Forms: aumenta el riesgo del refactor y colisiona con el plan #1. (c) Añadir `PATCH /dishes/:id/availability` en la API: cambio de contrato fuera de alcance.

**Tests.** Se usa el builder `@angular/build:unit-test` (Angular 21) con `vitest` + `jsdom` (misma librería de tests que la API). Funciones puras y stores/APIs se testean con `TestBed` + `provideHttpClient` + `provideHttpClientTesting`. Los specs viven junto al código (`*.spec.ts`).

## 5. Lista de tareas

Cada tarea dura 5-10 minutos y es un ciclo TDD completo: 🔴 test que falla → 🟢 código mínimo que lo pasa → 🔵 refactor → commit → tachar la tarea. No separes los tests de su implementación en tareas distintas. Solo las tareas de preparación del entorno de test (si hacen falta) y la documentación van sin ciclo rojo/verde. Ordénalas por dependencias, de lo más interno a lo más externo.

Las rutas son relativas a `packages/web-admin/src/app/` salvo que se indique otra cosa. Comando de tests: `npm test -w @resttek/web-admin` (`ng test --watch=false`).

**Preparación**

- [ ] **T1** (~10 min) — Preparar tests unitarios en `web-admin`: `devDependencies` `vitest` y `jsdom`, target `test` (`@angular/build:unit-test`) en `angular.json`, `tsconfig.spec.json` (tipos `vitest/globals`), script `"test": "ng test --watch=false"`, y script raíz `test:admin`. Verificación: un `spec` trivial (`src/app/smoke.spec.ts` con `expect(1).toBe(1)`) pasa con `npm test -w @resttek/web-admin` y `ng build` sigue compilando (los `*.spec.ts` ya están excluidos en `tsconfig.app.json`) — `packages/web-admin/package.json`, `packages/web-admin/angular.json`, `packages/web-admin/tsconfig.spec.json`, `package.json`

**Modelos y utilidades puras**

- [ ] **T2** (~5 min) — Categorías de plato en un único mapa — `models/dish.model.ts`, `models/dish.model.spec.ts`
  - 🔴 Test: `DISH_CATEGORIES.principal === 'Principal'` y `Object.keys(DISH_CATEGORIES)` es `['entrante','principal','postre','bebida']`; falla porque el módulo no existe.
  - 🟢 Código: `DishCategory`, `DISH_CATEGORIES`, interfaces `Dish`, `DishIngredient`, `DishDto`.
- [ ] **T3** (~5 min) — Pipe `categoryLabel` — `shared/category-label.pipe.ts`, `shared/category-label.pipe.spec.ts`
  - 🔴 Test: `transform('postre')` → `'Postre'`; `transform('otra')` → `'otra'` (mismo comportamiento que `getCategoryLabel`).
  - 🟢 Código: lookup en `DISH_CATEGORIES` con fallback al valor.
- [ ] **T4** (~5 min) — Pipe `priceFormat` — `shared/price-format.pipe.ts`, `shared/price-format.pipe.spec.ts`
  - 🔴 Test: `transform(12.5)` → `'12.50 €'`; `transform('7')` → `'7.00 €'`.
  - 🟢 Código: `parseFloat(price).toFixed(2) + ' €'`.
- [ ] **T5** (~5 min) — Helper `extractApiError` — `shared/api-error.ts`, `shared/api-error.spec.ts`
  - 🔴 Test: `{ error: { message: 'Nombre duplicado' } }` → `'Nombre duplicado'`; `{}` y `null` → fallback.
  - 🟢 Código: `err?.error?.message ?? fallback`.
- [ ] **T6** (~5 min) — Mapper `toDishDto` — `components/dish-form/dish-form.mapper.ts`, `components/dish-form/dish-form.mapper.spec.ts`
  - 🔴 Test: entrada con `price: '12.5'` → DTO con `price: 12.5` y sin campos extra (`id`, `restaurantId`); `description: null` se conserva.
  - 🟢 Código: `toDishDto(value: DishFormValue): DishDto` y tipo `DishFormValue`.
- [ ] **T7** (~5 min) — Validación `validateDishForm` — `components/dish-form/dish-form.validation.ts`, `components/dish-form/dish-form.validation.spec.ts`
  - 🔴 Test: nombre vacío → `{ name: true }`; precio `0`, `'abc'` o `-1` → `{ price: true }`; datos válidos → `{}`.
  - 🟢 Código: mismas reglas que `DishFormComponent.save()` actual.
- [ ] **T8** (~10 min) — Funciones de ingredientes del plato — `components/dish-form/dish-ingredients.ts`, `components/dish-form/dish-ingredients.spec.ts`
  - 🔴 Test: `addIngredient([], 'i1', 2)` → `[{ingredientId:'i1',quantity:2}]` sin mutar la entrada; duplicado (`'i1'` otra vez) o cantidad `0` → lista igual; `removeIngredient` quita por `ingredientId`; `ingredientLabel([{id:'i1',name:'Sal',unit:'g'}], 'i1')` → `'Sal (g)'`, id desconocido → el propio id.
  - 🟢 Código: las tres funciones puras.

**Capa HTTP**

- [ ] **T9** (~10 min) — `DishApi` (solo HTTP, `API_URL`, `create`/`update` separados) — `api/dish.api.ts`, `api/dish.api.spec.ts`
  - 🔴 Test (`HttpTestingController`, `API_URL = '/api/v1'`): `list('r1')` → `GET /api/v1/restaurants/r1/dishes`; `get`, `create` (`POST`), `update` (`PUT .../dishes/d1`), `remove` (`DELETE`).
  - 🟢 Código: clase con `inject(HttpClient)` e `inject(API_URL)`.
- [ ] **T10** (~5 min) — `IngredientApi` — `api/ingredient.api.ts`, `api/ingredient.api.spec.ts`
  - 🔴 Test: `list('r1')` → `GET /api/v1/restaurants/r1/ingredients`.
  - 🟢 Código: clase con `list`.
- [ ] **T11** (~5 min) — `RestaurantApi` — `api/restaurant.api.ts`, `api/restaurant.api.spec.ts`
  - 🔴 Test: `list()` → `GET /api/v1/restaurants`; `get('r1')`; `create(body)` → `POST /api/v1/restaurants`; `update('r1', body)` → `PUT /api/v1/restaurants/r1`.
  - 🟢 Código: clase con los 4 métodos.
- [ ] **T12** (~5 min) — `EmployeeApi` — `api/employee.api.ts`, `api/employee.api.spec.ts`
  - 🔴 Test: `list('r1')` → `GET /api/v1/restaurants/r1/employees`; `create(e)` → `POST /api/v1/employees`.
  - 🟢 Código: clase con `list` y `create`.

**Stores**

- [ ] **T13** (~10 min) — `DishStore`: carga y consulta — `store/dish.store.ts`, `store/dish.store.spec.ts`
  - 🔴 Test (con `DishApi` falso): `load('r1')` pone `loading` a `true` y luego `false` y deja `dishes()` con la respuesta; si la API falla, `error()` vale `'No se pudieron cargar los platos.'` y `loading()` `false`; `findById('r1','d1')` devuelve el plato cargado y `undefined` para otro restaurante.
  - 🟢 Código: signals privadas + `asReadonly()`, `load`, `findById`.
- [ ] **T14** (~10 min) — `DishStore`: guardar y disponibilidad — `store/dish.store.ts`, `store/dish.store.spec.ts`
  - 🔴 Test: `save('r1', dto)` llama a `create`, `save('r1', dto, 'd1')` a `update`; `setAvailability('r1', dish, false)` llama a `update` con el DTO completo de `toDishDto(dish)` y `available: false`, y `dishes()` contiene el plato con la disponibilidad devuelta por el servidor **sin mutar** el objeto original.
  - 🟢 Código: `save` y `setAvailability`.
- [ ] **T15** (~5 min) — `DishStore.remove` — `store/dish.store.ts`, `store/dish.store.spec.ts`
  - 🔴 Test: tras `remove('r1','d1')` el plato desaparece de `dishes()`; si la API falla, `dishes()` no cambia y la promesa rechaza.
  - 🟢 Código: llamar a `DishApi.remove` y filtrar la señal.
- [ ] **T16** (~5 min) — `RestaurantStore` — `store/restaurant.store.ts`, `store/restaurant.store.spec.ts`
  - 🔴 Test: `load()` deja `restaurants()` con la respuesta, `loading()` pasa por `true` y acaba en `false` (también si falla la API).
  - 🟢 Código: store con `load`.
- [ ] **T17** (~5 min) — `EmployeeStore` — `store/employee.store.ts`, `store/employee.store.spec.ts`
  - 🔴 Test: `load('r1')` vacía la lista antes de cargar y la rellena después; `add(e)` añade al final.
  - 🟢 Código: store con `load` y `add`.

**Servicios y directiva de UI**

- [ ] **T18** (~5 min) — `DialogService` — `shared/dialog.service.ts`, `shared/dialog.service.spec.ts`
  - 🔴 Test: con un `DOCUMENT` falso (`defaultView.confirm` → `true`) `confirm('x')` devuelve `true` y `alert('y')` llama a `defaultView.alert('y')`.
  - 🟢 Código: servicio sobre `inject(DOCUMENT).defaultView`.
- [ ] **T19** (~5 min) — Directiva `appAutofocus` — `shared/autofocus.directive.ts`, `shared/autofocus.directive.spec.ts`
  - 🔴 Test: un componente host con `<input appAutofocus>` queda como `document.activeElement` tras `detectChanges`.
  - 🟢 Código: `ngAfterViewInit` → `elementRef.nativeElement.focus()`.

**Componentes de platos**

- [ ] **T20** (~10 min) — Subcomponente `dish-ingredients-editor` — `components/dish-form/dish-ingredients-editor/dish-ingredients-editor.component.{ts,html,css,spec.ts}`, `app.module.ts`
  - 🔴 Test (`TestBed`): con `all=[{id:'i1',name:'Sal',unit:'g'}]` y `selected=[]`, elegir `i1`, cantidad `2` y pulsar `+` emite `selectedChange` con `[{ingredientId:'i1',quantity:2}]`; pulsar la papelera de una chip emite la lista sin ese ingrediente; la chip muestra `Sal (g) — 2`.
  - 🟢 Código: componente con `input()`/`output()` que usa `addIngredient`/`removeIngredient`/`ingredientLabel`; mover aquí el HTML y CSS de la sección "Ingredientes del plato"; declararlo en `AppModule`.
- [ ] **T21** (~10 min) — `DishFormComponent` sobre store/API, validación y mapper — `components/dish-form/dish-form.component.{ts,html,spec.ts}`, `app.module.ts` (declarar pipes y directiva)
  - 🔴 Test: en modo edición (`/restaurants/r1/dishes/d1/edit`) con `DishApi`/`IngredientApi` falsos carga ingredientes y plato; con nombre vacío `save()` marca `errors.name`, muestra "Revisa los campos marcados" y **no** llama a la API; con datos válidos llama a `DishStore.save` con `toDishDto(...)` y navega a `/restaurants/r1/dishes`; si la API falla muestra `extractApiError(err, 'Error al guardar el plato.')`; en alta, `#dish-name` recibe el foco, en edición no.
  - 🟢 Código: reescribir el componente con `inject`, tipos `DishFormValue`/`Dish`, sin `any`, `appAutofocus` en `#dish-name` (solo alta), `<app-dish-ingredients-editor>` y `categoryLabel`; eliminar `document.getElementById`.
- [ ] **T22** (~10 min) — `DishListComponent` con signals y `DialogService` — `components/dish-list/dish-list.component.{ts,html,spec.ts}`
  - 🔴 Test: con 3 platos (2 `entrante`, 1 `postre`) `filteredDishes()` devuelve 3 con `todos` y 1 tras `filter.set('postre')`; `toggleAvailable` llama a `DishStore.setAvailability(restaurantId, dish, !dish.available)` y detiene la propagación del click; `deleteDish` con `confirm → false` no llama a la API, con `true` quita el plato y muestra "Plato eliminado"; si falla la API, `DialogService.alert('Error al eliminar el plato.')`; el `restaurantId` sale de la ruta.
  - 🟢 Código: usar `DishStore`, `computed`, `DialogService`, `categoryLabel`/`priceFormat` en la plantilla (sin `console.log`).

**Resto de consumidores y borrado del god service**

- [ ] **T23** (~10 min) — `RestaurantList`, `RestaurantForm` y `Shell` sobre `RestaurantStore`/`RestaurantApi` — `components/restaurant-list/*.{ts,html}`, `components/restaurant-form/restaurant-form.component.ts`, `components/shell/shell.component.ts`, `components/restaurant-list/restaurant-list.component.spec.ts`
  - 🔴 Test: `RestaurantListComponent` con `RestaurantStore` falso muestra una fila por restaurante, el spinner mientras `loading()` y llama a `store.load()` al iniciarse.
  - 🟢 Código: `RestaurantList` usa `RestaurantStore`; `RestaurantForm` usa `RestaurantApi.get/create/update` (según haya `id`); `Shell.loadRestaurants()` usa `RestaurantStore.load()` en lugar de `dataService.http.get(...)`. `ShellComponent.restaurants` se mantiene con el mismo contrato para el dashboard (se lee del store).
- [ ] **T24** (~10 min) — `EmployeeList` y `EmployeeForm` sobre `EmployeeStore`/`EmployeeApi` y `ActivatedRoute` — `components/employee-list/*.{ts,html}`, `components/employee-form/employee-form.component.ts`, `components/employee-list/employee-list.component.spec.ts`
  - 🔴 Test: `EmployeeListComponent` en la ruta `/restaurants/r1/employees` llama a `EmployeeStore.load('r1')` y el enlace "nuevo" apunta a `/restaurants/r1/employees/new` (hoy sale de `dataService.currentRestaurantId`).
  - 🟢 Código: leer `restaurantId` con `ActivatedRoute`; `EmployeeForm` usa `EmployeeApi.create` + `EmployeeStore.add`.
- [ ] **T25** (~5 min) — Eliminar `DataService` — `data.service.ts` (borrar), `app.module.ts`
  - 🔴 Test: `npx ng build` falla si queda alguna importación a `DataService`; antes de borrar, `grep -rn "DataService" packages/web-admin/src` debe dar 0 resultados fuera del propio fichero (se añade como comprobación y se ejecuta la suite completa).
  - 🟢 Código: borrar el fichero, confirmar con `ng build` y la suite completa (`npm test -w @resttek/web-admin`).

**Documentación**

- [ ] **T26** (~5 min) — Documentación (commit `docs:`) — `CLAUDE.md`, `docs/arquitectura/arquitectura-frontend.md`, `TODOS/solid.md`

## 6. Plan de pruebas

- **Automático**: `npm test -w @resttek/web-admin` (nuevo) debe pasar entero; `npm test` (API) no debe cambiar; `npm run build -w @resttek/web-admin` compila sin errores ni referencias a `DataService`.
- **Manual (regresión, con `npm run dev:api` + `npm run dev:admin` y `npm run seed`, login `admin@resttek.com`)**:
  1. `/restaurants`: lista, spinner y "nuevo/editar restaurante" funcionan; tras guardar aparece en la lista y en el menú lateral del shell.
  2. `/restaurants/:id/dishes`: filtra por cada categoría, formatea precios `12.50 €`, el toggle de disponibilidad persiste al recargar, eliminar pide confirmación y muestra "Plato eliminado".
  3. `/restaurants/:id/dishes/new`: foco inicial en el nombre; nombre vacío o precio ≤ 0 → "Revisa los campos marcados" y campos en rojo; añadir/quitar ingredientes (sin duplicados); guardar vuelve al listado.
  4. `/restaurants/:id/dishes/:id/edit`: precarga datos e ingredientes, sin foco forzado; actualizar guarda.
  5. `/restaurants/:id/employees` y `/new`: lista y alta funcionan; el enlace "nuevo" conserva el id del restaurante también al recargar la página.
- **Casos límite**: carga con la API caída (mensaje "No se pudieron cargar los platos."), edición de un plato recién cargado (acierto de caché) y edición entrando directamente por URL (sin caché → `GET` del plato), precio con coma/texto, categoría desconocida (la etiqueta cae al valor tal cual).

## 7. Documentación a actualizar

- [ ] `CLAUDE.md`: en "Arquitectura del frontend" sustituir la mención genérica por la estructura de `web-admin` (`models/ api/ store/ shared/`) y el uso de `API_URL`; añadir el comando `npm test -w @resttek/web-admin` y quitar "no hay tests" para `web-admin`.
- [ ] `docs/arquitectura/arquitectura-frontend.md`: sección "Estado: el patrón Store" y estructura de `web-admin` (APIs + stores + pipes; ya no hay `DataService`).
- [ ] `TODOS/solid.md`: marcar como resueltos el god service y `DishFormComponent`; `DishListComponent` y los puntos de DIP/ISP relativos a `DataService` quedan parcialmente resueltos (indicar qué falta: ingredientes y shell).

## 8. Riesgos y dudas abiertas

- **Instalación de dependencias**: `node_modules` no está instalado aquí; T1 requiere `npm install` y que `vitest`/`jsdom` sean compatibles con Angular 21 (el builder `@angular/build:unit-test` lo soporta de forma nativa). Comprobar versiones al instalar.
- **Conflicto con el plan #1** (`plans/plan-1.md`, T8-T16 modifican `dish-form.component.html/.ts`): implementar este plan antes o resolver conflictos a mano. Se conservan `id="dish-name"`, las clases CSS y el comportamiento visible para no romper los E2E de ese plan.
- **Cambio de comportamiento en el foco**: hoy se enfoca `#dish-name` también al editar (con 300 ms de retraso); el diseño lo limita al alta. Si se prefiere mantenerlo siempre, basta aplicar la directiva sin condición. (Duda abierta para quien implemente.)
- **`Employee` sin tipar del todo**: no se ha leído la forma completa en `employee-*`; la interfaz se completa en T24 leyendo esos componentes.
- **`ShellComponent` sigue acoplado** (instancia estática, `localStorage`, inyección en el dashboard): este plan solo cambia su fuente de datos; el resto queda para otra issue y el `RestaurantFormComponent` seguirá llamando a `ShellComponent.instance.loadRestaurants()` hasta entonces.
- **Cambio incompatible interno**: se borra `DataService`; no hay consumidores externos (grep confirma que solo se usa en `web-admin`).
