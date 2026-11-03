# Plan: Accesibilidad de colores y del formulario de platos (Playwright + axe)

- **Issue**: #1
- **Tipo**: feature
- **Fecha**: 2026-11-03
- **Estado**: pendiente

## 1. Contexto y objetivo

`TODOS/a11y.md` recoge una auditoría WCAG 2.2 AA estática de `web-admin` (+ `web-shared`). Esta issue cubre dos bloques:

1. **Colores**: contraste de texto (1.4.3), contraste no textual (1.4.11) y uso del color como único indicador (1.4.1).
2. **Formulario de platos** (`/restaurants/:restaurantId/dishes/new` y `/:id/edit`): etiquetas, semántica, teclado, foco, errores, tamaño de objetivo y mensajes de estado.

Además se monta la infraestructura para **validarlo automáticamente**: Playwright (E2E) + `@axe-core/playwright`, hoy inexistentes en el repo (no hay ningún `playwright`/`axe` en los `package.json`, ni carpeta `e2e/`).

**Criterio de aceptación adicional (pedido en la issue)**: existe un vídeo, grabado con Playwright, que recorre `dishes/new` **solo con teclado** (Tab, Shift+Tab, Espacio, Enter), donde se ve el foco en cada control y los errores de validación. El vídeo se guarda en local, **no se commitea** (carpetas ignoradas en `.gitignore`) y el spec que lo genera lleva **aserciones**: falla si el flujo por teclado se rompe, no es solo una grabación.

Medición de contraste (calculada con la fórmula WCAG sobre los tokens reales de `styles.css`):

| Color | Sobre `--bg-card #1a1e2b` | Sobre `--bg-hover #222839` | Veredicto |
| --- | --- | --- | --- |
| `#3d4256` (texto hardcodeado) | 1,67 | 1,48 | falla |
| `--text-muted #5c6378` | 2,78 | 2,45 | falla |
| `--text-secondary #8b92a8` | 5,36 | 4,74 | ok |
| `#ff9a9a` sobre `--red #ef4444` (toast) | ~1,9 (según la auditoría) | — | falla |
| blanco sobre `--red #ef4444` (`.btn-danger`) | ~3,8 (según la auditoría) | — | falla; blanco sobre `#dc2626` = 4,83, sobre `#b91c1c` = 6,47 |
| `--border-color #2a2f42` (borde de controles) | 1,25 | 1,11 | falla 1.4.11 (≥3); `#6b7390` da 3,54 sobre card y 3,37 sobre `--bg-input` |
| `#fca5a5` sobre fondo tintado de `.alert-error` | ~8,3 | — | ok (hoy `#ef4444`: ~4,2) |

## 2. Alcance

**Incluye**

- Infraestructura Playwright + axe en la raíz del monorepo (`playwright.config.ts`, `e2e/`, scripts npm, `.gitignore`).
- Colores globales (tokens en `packages/web-admin/src/styles.css` y su copia idéntica `packages/web-shared/src/lib/styles/base.css`): `--text-muted`, nuevo `--border-control`, `.btn-danger`, `.alert-error`.
- Colores hardcodeados de `dish-form.component.css` y `dish-list.component.css` (`#3d4256`, `.toast-error`) y comprobación de contraste con axe en las páginas de `web-admin` (login incluido).
- Todo el formulario de platos (`dish-form.component.{html,ts,css}`): h1, enlace "volver" con nombre, labels, `fieldset/legend`, botones reales, `role="switch"` con texto "Sí/No", `aria-pressed` en categorías, `type="submit"` + `(ngSubmit)`, quitar `tabindex="1"`, foco inicial solo al crear, errores por campo (`aria-invalid`, `aria-describedby`, texto + icono), resumen con `role="alert"` y foco, duración del aviso, `:focus-visible` global, tamaño de objetivo ≥ 24 px.
- Spec de vídeo de teclado (`e2e/dish-form-keyboard-video.spec.ts`) con aserciones.
- Documentación (`CLAUDE.md`, `docs/arquitectura/arquitectura-frontend.md`).

**No incluye**

- El resto de la auditoría: tabla de platos como `div` (`dish-list`), skip link, `<title>` por ruta, reflow/responsive, `prefers-reduced-motion`, autocompletado, `restaurant/ingredient/employee-form`, `aria-live` global, landmarks. De `dish-list` solo se tocan los **colores**.
- Convertir `web-admin` a standalone/signals/zoneless (el código real usa NgModules; ver sección 3).
- Eliminar la duplicación `styles.css` / `base.css` (se mantienen sincronizados; ver riesgos).
- Tests de componentes Angular (`ng test`): el proyecto no tiene `test` target en `angular.json` para los frontends y la validación pedida es E2E.
- CI (no hay workflows en el repo).

## 3. Análisis del código actual

- **Discrepancia docs/código**: `CLAUDE.md` y `docs/arquitectura/arquitectura-frontend.md` dicen standalone + zoneless, pero `web-admin` es **NgModule** (`app.module.ts`, `standalone: false`, `provideZoneChangeDetection()`, `FormsModule`/`ngModel`, `*ngIf`/`*ngFor`, `HttpClientModule`). El plan sigue el código real y no migra.
- `packages/web-admin/src/app/components/dish-form/dish-form.component.html`:
  - `div.title` en vez de `h1` (l.7); enlace "volver" solo con icono (l.4-6).
  - `input`s sin `<label>` (solo `placeholder`, l.16, 20, 40); `select`/`input` de ingredientes sin etiqueta (l.57, 61); `tabindex="1"` en la descripción (l.40).
  - Categoría y disponible con `<span class="label">` y `div (click)` (l.24-36); quitar ingrediente = `span (click)` con icono de 12 px (l.50); "+" y **Guardar** son `div.btn (click)` (l.62, 70); el `<form>` no tiene `(ngSubmit)`, así que Enter no guarda.
- `dish-form.component.ts`: `errors` es `{name?: true, price?: true}` (sin texto), `showError()` muestra un toast que desaparece a los 3 s (l.100-103), `save()` valida `name` y `price` (l.105-112), foco forzado a `#dish-name` con `setTimeout(300)` también al editar (l.63-66). `price` empieza en `0` y es `type="text"`.
- `dish-form.component.css`: `* :focus { outline:none !important; box-shadow:none !important }` (l.122-125) elimina el foco; `#3d4256` en placeholder y `.label`; `.chip` usa `--text-muted` sobre `--bg-hover`; `.toast-error` texto `#ff9a9a` sobre `--red`, 12 px; toggle 40×22; `.chip-remove` con icono 12 px.
- `packages/web-admin/src/styles.css` (idéntico a `packages/web-shared/src/lib/styles/base.css`, confirmado con `diff`): tokens `--text-muted`, `--border-color`; `button { outline:none }` (l.58); `.form-control:focus { outline:none }` con halo `--green-glow` (l.135-139); `.btn-danger`, `.alert-error`, `table th` usan colores insuficientes.
- `dish-list.component.css`: `#3d4256` en l.31, 71, 87.
- Auth para E2E: `localStorage` `auth_token` / `auth_user` (`web-shared/src/lib/auth/auth.store.ts`); `AuthGuard` de `web-admin` solo comprueba `auth_token`; login = `POST /api/v1/auth/login {email,password}`; `npm run seed` crea `admin@resttek.com` con contraseña igual al email y restaurantes con **UUID aleatorio** (hay que descubrir el id en el test, no hardcodearlo).
- Entorno: `web-admin` en `:4200` con proxy `/api` → `:3000`; la BD es `packages/api/resttek.db` (sin override por variable de entorno; con `NODE_ENV=test` es `:memory:`, inútil para un proceso aparte).

## 4. Diseño de la solución

### Infraestructura de pruebas (raíz del monorepo)

- `devDependencies` en el `package.json` raíz: `@playwright/test`, `@axe-core/playwright` (versiones exactas actuales al instalar). Solo Chromium (`npx playwright install chromium`).
- `playwright.config.ts` (raíz): `testDir: 'e2e'`, `baseURL: 'http://localhost:4200'`, `outputDir: 'test-results'`, `use: { video: 'off', trace: 'retain-on-failure', locale: 'es-ES', viewport: 1280×720 }`, `workers: 1` (la BD es compartida), `webServer` con dos entradas (`npm run dev:api` → `http://localhost:3000/health`; `npm run dev:admin` → `http://localhost:4200`) y `reuseExistingServer: !process.env.CI`, `timeout` 120 s para el arranque de Angular.
- Dos proyectos: `setup` (`e2e/auth.setup.ts`: ejecuta `npm run seed`, hace login por UI y guarda `e2e/.auth/admin.json`) y `chromium` (depende de `setup`, usa ese `storageState`).
- Scripts raíz: `test:e2e` (`playwright test`) y `e2e:video` (`playwright test e2e/dish-form-keyboard-video.spec.ts --headed`).
- `.gitignore`: `test-results/`, `playwright-report/`, `e2e-videos/`, `e2e/.auth/`.
- Helpers en `e2e/helpers/`: `restaurant.ts` (`getFirstRestaurantId(request)` vía `GET /api/v1/restaurants` con el token del storageState), `axe.ts` (`runAxe(page, {rules?, tags?})` → `AxeBuilder`, esperando antes a que terminen las animaciones: `document.getAnimations().length === 0`, porque `fade-in` falsea el contraste).
- Limpieza de datos: el spec que guarda un plato lo borra en `afterEach` por API (`DELETE /restaurants/:id/dishes/:dishId`), localizándolo por nombre único (`Plato E2E <timestamp>`), para no ensuciar el seed.

### Colores

- `--text-muted` → `#8b92a8` o más claro (mín. 4,5:1 sobre `--bg-hover`, el peor fondo usado: 4,74 con `#8b92a8`). Efecto colateral deseado: arregla de golpe sidebar, dashboards, cabeceras de tabla, estados vacíos y chips.
- Nuevo token `--border-control: #6b7390` (≥ 3:1) para `.form-control`, `.btn-secondary` y el borde del toggle; `--border-color` se mantiene para separadores decorativos.
- `.btn-danger` → fondo `#dc2626` (4,83 con blanco); `.alert-error` texto `#fca5a5`; `.toast-error` → fondo `#b91c1c`, texto blanco, 14 px, con icono.
- Sustituir todos los `#3d4256` de texto por `var(--text-secondary)` (`dish-form.css`, `dish-list.css`).
- axe **no evalúa placeholders**, así que se prueban con `getComputedStyle(el, '::placeholder').color` en Chromium y la fórmula de contraste dentro del test.
- Uso del color (1.4.1) en el formulario: categoría seleccionada con borde + `aria-pressed` + check; toggle con texto "Sí"/"No"; error con texto + icono, no solo borde rojo.

### Formulario de platos

Estructura objetivo del template (se mantiene `ngModel`/`*ngIf`, sin migrar a signals):

```html
<h1 class="title">Nuevo plato</h1>
<a class="back-link" aria-label="Volver a platos"><lucide-icon aria-hidden="true" …/></a>
<div role="alert" class="toast-error"> <ng-container *ngIf="error">…</ng-container></div>  <!-- contenedor siempre en el DOM -->
<form (ngSubmit)="save()" novalidate>
  <label for="dish-name">Nombre del plato <span aria-hidden="true">*</span></label>
  <input id="dish-name" required aria-required="true" [attr.aria-invalid]="errors.name ? 'true' : null" aria-describedby="dish-name-error">
  <p id="dish-name-error" class="field-error" *ngIf="errors.name">⚠ Indica el nombre del plato</p>
  <label for="dish-price">Precio (€) *</label> <input id="dish-price" inputmode="decimal" aria-describedby="dish-price-hint dish-price-error">
  <fieldset><legend>Categoría</legend><button type="button" aria-pressed="true|false">Principal</button>…</fieldset>
  <div role="group" aria-labelledby="dish-available-label"><span id=…>Disponible</span>
     <button type="button" role="switch" [attr.aria-checked]="dish.available">{{ dish.available ? 'Sí' : 'No' }}</button></div>
  <label for="dish-description">Descripción</label><textarea id="dish-description"> (sin tabindex)
  … ingredientes: <label> select "Ingrediente" (opción vacía "Selecciona un ingrediente"), <label> "Cantidad", <button type="button" aria-label="Añadir ingrediente">,
     cada chip con <button type="button" aria-label="Quitar {{nombre}}">
  <button type="submit">Guardar</button>
</form>
```

Decisiones:

- **`novalidate`** en el `<form>` para que la validación nativa de `required` no pise los mensajes propios; `required`/`aria-required` solo informan a tecnologías de apoyo. Leyenda visible "* obligatorio".
- **Enter** en el campo de cantidad (y en el select) no debe guardar el plato por envío implícito: `(keydown.enter)="$event.preventDefault(); addIngredient()"`. Enter en nombre/precio envía el formulario.
- **Errores**: `errors` pasa de `true` a mensaje de texto (`errors.name = 'Indica el nombre del plato'`, `errors.price = 'Introduce un precio mayor que 0'`). Tras un envío inválido, el foco va al primer campo inválido y el resumen (`role="alert"`) dice "Revisa los campos marcados (2 errores)". El resumen **no se autodescarta a los 3 s**: se mantiene hasta corregir o cerrar (WCAG 2.2.1); `showError` pasa a ≥ 10 s o sin timeout para errores de validación.
- **Foco inicial**: `ngOnInit` solo enfoca `#dish-name` si es alta (`!params['id']`), y sin `setTimeout` de 300 ms si es posible (`afterNextRender`/`ngAfterViewInit`).
- **Categorías**: botones con `aria-pressed` (no radios nativos) para que cada una sea un Tab-stop y se active con Espacio/Enter, que son exactamente las teclas del vídeo de aceptación.
- **Tamaño de objetivo** (2.5.8): `.chip-remove`, botón "+", toggle y `.back-link` con `min-width/min-height: 24px` (objetivo 32-44 cuando quepa); el toggle sube a ≥ 24 px de alto.
- **Foco visible**: `:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px }` global en `styles.css` + `base.css`; se eliminan `* :focus`, `button { outline:none }` y `.form-control:focus {outline:none}`. `#4ade80` sobre `#1a1e2b` = 9,5:1 (≥ 3:1).
- Alternativas descartadas: radios nativos para categoría (un solo Tab-stop, flechas), `title` como nombre accesible, validación nativa del navegador.

### Spec de vídeo de teclado

`e2e/dish-form-keyboard-video.spec.ts` con `test.use({ video: { mode: 'on', size: { width: 1280, height: 720 } }, viewport: { width: 1280, height: 720 } })`. Pausa corta (`pause = () => page.waitForTimeout(400)`) tras cada pulsación. Recorrido y aserciones (`toBeFocused()` en cada Tab, además de aserciones sobre estado):

1. Tab desde el inicio de la página hasta `#dish-name`; Tab → precio → categoría (Entrante, Principal, Postre, Bebida) → Disponible → descripción → select de ingrediente → cantidad → «+». Shift+Tab hacia atrás una vez (cantidad) y de nuevo Tab. Aserción: cada control recibe el foco **y** tiene `outline-style != none` y `outline-width ≥ 2px`.
2. Categoría con Espacio (`aria-pressed="true"` en "Postre"); Disponible con Espacio (`aria-checked="false"` y texto "No", otra vez → "Sí").
3. Añadir ingrediente: select con teclado (`selectOption`/flechas), cantidad, Tab a «+», Enter → aparece el chip; Tab al botón "Quitar …", Enter → desaparece.
4. Enter con el formulario vacío (foco en nombre): aparecen los dos mensajes de error, `aria-invalid="true"`, el resumen `role="alert"` visible, foco en el nombre.
5. Rellenar nombre/precio por teclado, Tab hasta «Guardar», Enter → redirección a `/restaurants/<id>/dishes` y el plato aparece en la lista.
6. Paso final: `await page.close()` y `await page.video()!.saveAs('e2e-videos/dish-form-teclado.webm')`; se comprueba con `fs.existsSync` y se adjunta al informe con `testInfo.attach`. Playwright también deja el original en `test-results/`.
7. `afterEach`: borrar por API el plato creado.

## 5. Lista de tareas

Cada tarea dura 5-10 minutos y es un ciclo TDD completo: 🔴 test que falla → 🟢 código mínimo que lo pasa → 🔵 refactor → commit → tachar la tarea. No separes los tests de su implementación en tareas distintas. Solo las tareas de preparación del entorno de test (si hacen falta) y la documentación van sin ciclo rojo/verde. Ordénalas por dependencias, de lo más interno a lo más externo.

**Preparación del entorno de pruebas (sin ciclo rojo/verde; cada una se verifica ejecutando algo)**

- [ ] **T1** (~10 min) — Instalar y configurar Playwright + axe en la raíz — `package.json`, `playwright.config.ts`, `.gitignore`
  - Instalar `@playwright/test` y `@axe-core/playwright` como devDependencies, `npx playwright install chromium`, scripts `test:e2e` y `e2e:video`, `.gitignore` con `test-results/`, `playwright-report/`, `e2e-videos/`, `e2e/.auth/`.
  - Verificación: `npx playwright test --list` no da error y `git check-ignore test-results e2e-videos e2e/.auth playwright-report` devuelve las cuatro rutas.
- [ ] **T2** (~10 min) — Setup de autenticación y helpers E2E — `e2e/auth.setup.ts`, `e2e/helpers/restaurant.ts`, `e2e/helpers/axe.ts`, `playwright.config.ts`
  - `auth.setup.ts`: `npm run seed` + login por UI + `storageState` en `e2e/.auth/admin.json`; helpers `getFirstRestaurantId` y `runAxe`; proyecto `chromium` dependiente de `setup`.
  - Verificación: con la API y `web-admin` arrancados por el `webServer`, `npx playwright test --project=setup` pasa y `e2e/.auth/admin.json` existe y no aparece en `git status`.
- [ ] **T3** (~5 min) — Smoke test de `dishes/new` autenticado — `e2e/dish-form-a11y.spec.ts`
  - Verificación: el test `carga /dishes/new con sesión` navega a `/restaurants/<id>/dishes/new` y ve `#dish-name`; pasa en verde con la configuración anterior (valida toda la cadena API + front + storageState antes de empezar a arreglar).

**Colores (de lo global a lo local)**

- [ ] **T4** (~10 min) — Texto con contraste ≥ 4,5:1 en las páginas de `web-admin` vía tokens — `e2e/color-contrast.spec.ts`, `packages/web-admin/src/styles.css`, `packages/web-shared/src/lib/styles/base.css`
  - 🔴 Test: para cada ruta (login sin sesión, `/dashboard`, `/restaurants`, `/restaurants/<id>/dashboard`, `/ingredients`, `/employees`, `/dishes/new`) ejecuta `runAxe(page, { rules: ['color-contrast'] })` y espera 0 violaciones; falla hoy por `--text-muted #5c6378` (2,78:1).
  - 🟢 Código: subir `--text-muted` a ≥ `#8b92a8` en `styles.css` y `base.css` (mismos cambios en ambos); `.btn-danger` a `#dc2626`; `.alert-error` texto `#fca5a5`.
- [ ] **T5** (~10 min) — Colores locales de `dish-list` y `dish-form` sin `#3d4256` ni texto sobre rojo ilegible — `e2e/color-contrast.spec.ts`, `packages/web-admin/src/app/components/dish-list/dish-list.component.css`, `packages/web-admin/src/app/components/dish-form/dish-form.component.css`
  - 🔴 Test: añadir a la lista de rutas `/dishes` (con filtros y tabla) y, en `dishes/new`, forzar el error (vaciar y guardar) y pasar axe `color-contrast` con el toast visible; comprobar con `getComputedStyle(input, '::placeholder')` que el placeholder tiene ≥ 4,5:1. Falla por `#3d4256` y `#ff9a9a` sobre `--red`.
  - 🟢 Código: `#3d4256` → `var(--text-secondary)`; `.toast-error` fondo `#b91c1c`, texto blanco, 14 px.
- [ ] **T6** (~10 min) — Bordes de controles con contraste ≥ 3:1 (1.4.11) — `e2e/non-text-contrast.spec.ts`, `packages/web-admin/src/styles.css`, `packages/web-shared/src/lib/styles/base.css`
  - 🔴 Test: en `dishes/new`, para `#dish-name`, `.btn-secondary` "Cancelar" y el toggle, calcular el contraste entre `border-color` computado y el fondo de su contenedor; esperar ≥ 3. Falla hoy (~1,25:1).
  - 🟢 Código: token `--border-control: #6b7390` y usarlo en `.form-control`, `.btn-secondary` y el borde del toggle (`dish-form.component.css`).

**Formulario de platos (de la estructura a la interacción)**

- [ ] **T7** (~5 min) — Foco visible global (2.4.7) — `e2e/dish-form-a11y.spec.ts`, `packages/web-admin/src/styles.css`, `packages/web-shared/src/lib/styles/base.css`, `packages/web-admin/src/app/components/dish-form/dish-form.component.css`
  - 🔴 Test: enfocar con Tab el campo de nombre, el enlace "Cancelar" y el botón Guardar y esperar `outline-style: solid`, `outline-width ≥ 2px` y contraste del color del outline ≥ 3:1; falla por `* :focus { outline:none !important }`.
  - 🟢 Código: añadir `:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px }` y borrar `* :focus`, `button { outline:none }` y `.form-control:focus { outline:none }`.
- [ ] **T8** (~5 min) — Encabezado `h1` y enlace "volver" con nombre accesible — `e2e/dish-form-a11y.spec.ts`, `packages/web-admin/src/app/components/dish-form/dish-form.component.html`
  - 🔴 Test: `getByRole('heading', { level: 1, name: 'Nuevo plato' })` visible y `getByRole('link', { name: 'Volver a platos' })`; falla (es un `div` y el enlace no tiene nombre).
  - 🟢 Código: `div.title` → `<h1 class="title">`; `aria-label="Volver a platos"` en el `<a>` y `aria-hidden="true"` en `lucide-icon`.
- [ ] **T9** (~10 min) — Nombre, precio y descripción con `<label>`, obligatoriedad y `tabindex` natural — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.html`, `dish-form.component.css`
  - 🔴 Test: `getByLabel('Nombre del plato')`, `getByLabel('Precio (€)')` (con `inputmode="decimal"` y `aria-required="true"`), `getByLabel('Descripción')` sin `tabindex`; leyenda "* obligatorio" visible; falla por no haber labels.
  - 🟢 Código: `<label for>` + ids (`dish-name`, `dish-price`, `dish-description`), `required`/`aria-required`, `inputmode="decimal"`, pista de formato asociada con `aria-describedby`, quitar `tabindex="1"`; `novalidate` en el `<form>`.
- [ ] **T10** (~10 min) — Categoría como grupo con botones `aria-pressed` — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.html`, `dish-form.component.css`
  - 🔴 Test: `getByRole('group', { name: 'Categoría' })` contiene 4 `button`; "Principal" tiene `aria-pressed="true"`; foco + Espacio sobre "Postre" lo marca y desmarca "Principal"; la selección tiene indicador no cromático (borde o check).
  - 🟢 Código: `<fieldset><legend>Categoría</legend>` con `<button type="button" [attr.aria-pressed]="dish.category === c" (click)="selectCategory(c)">`, estilo `.selected` con borde y check.
- [ ] **T11** (~10 min) — "Disponible" como `switch` con texto Sí/No — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.html`, `dish-form.component.css`
  - 🔴 Test: `getByRole('switch', { name: 'Disponible' })` con `aria-checked="true"` y texto "Sí"; Espacio → `aria-checked="false"` y "No"; alto ≥ 24 px.
  - 🟢 Código: `<button type="button" role="switch" [attr.aria-checked]="dish.available" (click)="toggleAvailable()">` con texto y dimensiones ≥ 24 px.
- [ ] **T12** (~10 min) — Sección de ingredientes con controles etiquetados y botones reales — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.html`, `dish-form.component.css`
  - 🔴 Test: `getByLabel('Ingrediente')` (opción vacía "Selecciona un ingrediente"), `getByLabel('Cantidad')`, `getByRole('button', { name: 'Añadir ingrediente' })`; tras añadir uno, `getByRole('button', { name: /^Quitar / })` existe, mide ≥ 24×24 px y al activarlo con Enter el chip desaparece.
  - 🟢 Código: labels, `<button type="button" aria-label="Añadir ingrediente">`, `<button type="button" class="chip-remove" aria-label="Quitar {{ nombre }}">`, iconos `aria-hidden`, `min-width/min-height: 24px`.
- [ ] **T13** (~10 min) — Enviar el formulario con Enter y botón `submit` — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.html`, `dish-form.component.ts`
  - 🔴 Test: con el nombre vacío, Enter en `#dish-name` muestra errores (hoy no pasa nada, Guardar es un `div`); Enter en el campo "Cantidad" **no** envía el formulario sino que añade el ingrediente seleccionado; `getByRole('button', { name: 'Guardar' })` es de tipo `submit`.
  - 🟢 Código: `<form (ngSubmit)="save()" novalidate>`, `<button type="submit" [disabled]="loading">Guardar</button>`, `(keydown.enter)` con `preventDefault()` + `addIngredient()` en select y cantidad.
- [ ] **T14** (~10 min) — Errores de validación identificables y anunciados (3.3.1, 4.1.3) — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.ts`, `dish-form.component.html`, `dish-form.component.css`
  - 🔴 Test: Enter con el formulario vacío → `#dish-name` con `aria-invalid="true"` y `aria-describedby` apuntando a un `<p>` con "Indica el nombre del plato"; igual en precio ("Introduce un precio mayor que 0"); un `role="alert"` con "Revisa los campos marcados" visible; el foco queda en `#dish-name`; tras 5 s sigue visible. Al escribir un nombre válido desaparece su error.
  - 🟢 Código: `errors` con mensajes de texto, `.field-error` con icono, contenedor `role="alert"` siempre presente en el DOM, foco al primer campo inválido, sin autodescarte de 3 s para validación.
- [ ] **T15** (~5 min) — Foco inicial solo al crear el plato — `e2e/dish-form-a11y.spec.ts`, `dish-form.component.ts`
  - 🔴 Test: en `/dishes/new` el nombre recibe el foco al cargar; en `/dishes/<id>/edit` (plato del seed) el foco **no** se mueve a `#dish-name` automáticamente (`document.activeElement` es `body`). Falla hoy en edición.
  - 🟢 Código: enfocar solo si no hay `params['id']`.
- [ ] **T16** (~10 min) — Puerta final: axe completo sin violaciones en `dishes/new` — `e2e/dish-form-a11y.spec.ts`
  - 🔴 Test: `runAxe(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })` sobre `dishes/new` en estado inicial y con errores visibles → 0 violaciones; si alguna regla restante falla (p. ej. `label`, `button-name`, `aria-valid-attr-value`), corregirla mínimamente en `dish-form.component.*`. Si ya pasa tras T4-T15, se anota en el commit y se marca la tarea sin código.
  - 🟢 Código: solo el ajuste mínimo que axe indique.

**Vídeo de teclado**

- [ ] **T17** (~10 min) — Recorrido por teclado con aserciones: Tab y Shift+Tab por todos los controles — `e2e/dish-form-keyboard-video.spec.ts`
  - 🔴 Test: `test.use({ video: { mode: 'on', size: { width: 1280, height: 720 } }, viewport: { width: 1280, height: 720 } })`; pausas `waitForTimeout(400)`; Tab por nombre → precio → Postre/categoría → Disponible → descripción → ingrediente → cantidad → «+» con `toBeFocused()` y outline visible en cada parada; un Shift+Tab y vuelta. Falla si falta cualquier control en el orden o el foco no se ve (si T7-T13 están hechas, el test debería poder escribirse en verde: se verifica primero rompiendo a propósito el orden con `tabindex="1"` y revirtiéndolo, o se anota que ya cubre T7-T13).
  - 🟢 Código: el propio spec; si aparece algún fallo real de orden de foco, corregir el componente.
- [ ] **T18** (~10 min) — Recorrido: Espacio/Enter, añadir y quitar ingrediente — `e2e/dish-form-keyboard-video.spec.ts`
  - 🔴 Test: Espacio en categoría y en Disponible (`aria-pressed`/`aria-checked` cambian), añadir ingrediente (select + cantidad + Enter en «+») con el chip visible y quitarlo con Enter sobre "Quitar …".
  - 🟢 Código: el spec; cualquier fallo real de teclado se arregla en `dish-form.component.*`.
- [ ] **T19** (~10 min) — Recorrido: errores con Enter vacío, guardado y limpieza — `e2e/dish-form-keyboard-video.spec.ts`
  - 🔴 Test: Enter con el formulario vacío → errores visibles y foco en nombre; rellenar nombre y precio por teclado, Tab hasta Guardar, Enter → URL `/restaurants/<id>/dishes` y el plato en la lista; `afterEach` elimina el plato por API (consulta `GET` posterior = sin el plato).
  - 🟢 Código: el spec y el helper de borrado en `e2e/helpers/restaurant.ts`.
- [ ] **T20** (~5 min) — Paso final: copiar el vídeo a `e2e-videos/dish-form-teclado.webm` — `e2e/dish-form-keyboard-video.spec.ts`
  - 🔴 Test: al final del spec, `await page.close()`, `await page.video()!.saveAs('e2e-videos/dish-form-teclado.webm')`, `expect(fs.existsSync(...)).toBe(true)` y tamaño > 0, y `testInfo.attach('video-teclado', { path })`. Falla hasta que exista el paso. Comprobar que `git status` no muestra `e2e-videos/` ni `test-results/`.
  - 🟢 Código: añadir el paso y crear el directorio con `fs.mkdirSync(..., { recursive: true })`.

**Documentación**

- [ ] **T21** (~5 min) — Documentación (commit `docs:`) — `CLAUDE.md`, `docs/arquitectura/arquitectura-frontend.md`
  - Comandos (`npm run test:e2e`, `npm run e2e:video`, `npx playwright install chromium`), estructura `e2e/`, dónde se guardan los vídeos y que están ignorados; convenciones de accesibilidad del formulario (labels, `aria-pressed`, `switch`, tokens de contraste `--text-muted`, `--border-control`, `:focus-visible`); corregir la frase "los frontends no tienen tests" y, de paso, la discrepancia standalone/NgModule en `web-admin`.
- [ ] **T22** (~5 min) — Marcar los ítems resueltos en `TODOS/a11y.md` (commit `docs:`) — `TODOS/a11y.md`
  - Tachar solo los ítems de colores y de `dish-form` realmente cubiertos y anotar los pendientes de `dish-list`.

## 6. Plan de pruebas

- `npm run test:e2e` (arranca API + `web-admin` si no están en marcha): `setup` y `chromium` en verde.
- **axe**: `color-contrast` en 7 rutas (login, dashboard, restaurantes, dashboard de restaurante, ingredientes, empleados, `dishes`, `dishes/new`) y **conjunto WCAG 2.2 AA completo** sobre `dishes/new` (inicial y con errores): 0 violaciones.
- **Comprobaciones que axe no hace** y se prueban a mano en el código del test: contraste del placeholder, contraste de bordes de controles (1.4.11), contraste y grosor del outline de foco, tamaño de objetivo ≥ 24×24, foco inicial solo en alta, Enter en cantidad no envía el formulario.
- **Teclado**: el spec de vídeo (T17-T20) falla si cambia el orden de tabulación, un control deja de ser alcanzable o de activarse con Espacio/Enter, los errores no aparecen, o el guardado no redirige.
- **Vídeo**: tras `npm run e2e:video`, abrir `e2e-videos/dish-form-teclado.webm` y comprobar a ojo que se ve el foco en cada control y los errores; `git status` limpio de vídeos.
- **Regresiones**: `npm test` (API) sigue verde (no se toca `packages/api`); `npm run build -w @resttek/web-admin` compila (budgets de `anyComponentStyle`: warning a 4 kB, error a 8 kB — `dish-form.component.css` va a crecer, comprobarlo); inspección visual de login, dashboard y listas por el cambio de `--text-muted` y `.btn-danger`.
- Casos límite: precio `0`, `abc`, `-1` y `12,5` (coma decimal: hoy `parseFloat('12,5') = 12`, se documenta, no se cambia); nombre solo con espacios (hoy es válido; fuera de alcance).

## 7. Documentación a actualizar

- [ ] `CLAUDE.md`: comandos E2E y estructura de `e2e/`.
- [ ] `docs/arquitectura/arquitectura-frontend.md`: sección de pruebas E2E/accesibilidad y convenciones del formulario.
- [ ] `TODOS/a11y.md`: marcar los ítems completados.

## 8. Riesgos y dudas abiertas

- **BD compartida**: el spec de guardado escribe en `packages/api/resttek.db` (sin override por variable de entorno). Se mitiga borrando el plato por API en `afterEach`; si falla a mitad queda un plato `Plato E2E …`. Alternativa más limpia (fuera de este plan porque toca `src/` de la API): variable `DB_PATH` en `config/database.ts` y un `.db` propio para E2E. **¿Se acepta la limpieza por API o se prefiere abrir una issue para la BD aislada?**
- **Alcance de axe fuera del formulario**: `color-contrast` se evalúa en 7 rutas y puede destapar colores hardcodeados en otros componentes (`shell.component.css`, dashboards); se ajustan solo los colores (parte "colores" de la issue), no otras reglas. Si hay muchos, T4/T5 pueden pasar de 10 min.
- **Duplicación `styles.css` / `base.css`**: se editan ambos a la vez. Riesgo de desincronización hasta que se unifiquen (fuera de alcance, ver `TODOS/a11y.md` l.6).
- **`--text-muted` ≈ `--text-secondary`**: se pierde jerarquía visual entre ambos tokens; se acepta porque la prioridad es el contraste (se puede diferenciar con peso/tamaño).
- **Animaciones** (`fade-in`, 0,3 s) pueden falsear el contraste en axe: el helper espera a `getAnimations()` vacío; si sigue siendo inestable, usar `page.emulateMedia({ reducedMotion: 'reduce' })` cuando exista la media query (pendiente de otra issue).
- **Arranque del `webServer`**: Angular dev server tarda; timeout de 120 s. En el worktree de `implement-plan` hay que ejecutar `npm install` y `npx playwright install chromium`.
- **Grabación**: el vídeo solo se genera con Chromium y su calidad (VP8, 1280×720) es suficiente para seguir el foco; si el outline se ve poco, se subirá a 3 px en el estilo global (hoy 2 px).
- **Compatibilidad**: no hay cambios incompatibles de API ni de datos. Cambio visual perceptible: textos grises más claros, bordes de campos más marcados, foco con contorno verde.
- **Precio con coma decimal** (`12,5`) queda sin resolver; se documenta como pista de formato ("usa punto decimal").
