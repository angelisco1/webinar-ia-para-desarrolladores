---
name: implement-plan
description: Implementa el plan local que plan-feature dejó en plans/plan-<n>.md, a partir del número de issue. Crea una rama desde development en un git worktree propio, aplica TDD estricto tarea a tarea con un commit por tarea y marca cada tarea como hecha en el plan. Úsala cuando el usuario pida implementar o ejecutar el plan de una issue.
argument-hint: <número de issue>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git switch:*), Bash(git worktree:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git diff:*), Bash(git check-ignore:*)
---

# Implementar un plan con TDD estricto

Implementa el plan de la issue $ARGUMENTS, guardado en `plans/plan-<n>.md`.

## Paso 0: requisitos

1. Necesitas el número de issue (`123` o `#123`). Si falta, pídelo y detente.
2. Lee `plans/plan-<n>.md` y `CLAUDE.md`. Si el plan no existe o no tiene tareas `- [ ] **T<n>**`, detente e indica que hay que generarlo con `plan-feature <n>`.
3. Si hay dudas abiertas (sección 8) que bloqueen una decisión, pregúntalas antes de empezar.
4. Si `git status --short` muestra cambios sin commitear, avisa y pregunta cómo proceder.

## Paso 1: rama y worktree

Nunca trabajes en el directorio principal ni en `development`, `main` o `master`.

1. Rama base `development`: si no existe, créala desde `main` (o `master`) con `git branch development main`. Si no hay ninguna, detente y avisa.
2. Nombre de rama: `<tipo>/<n>-<descripcion-kebab>` (2-5 palabras, sin acentos). `tipo` es el de Conventional Commits según el plan: `feature` → `feat`, `bugfix` → `fix`, u otro (`refactor`, `docs`…). Ej.: `feat/123-filtro-por-fecha`.
3. Worktree en `.claude/worktrees/<rama con "/" → "-">`, creado con `git worktree add -b <rama> <ruta> development`. Si `.claude/worktrees` no está ignorada (`git check-ignore`), añádela a `.gitignore` sin incluirla en commits de tareas.
4. Si la rama o el worktree ya existen, no los sobrescribas: pregunta si continuar en ellos.
5. Trabaja siempre dentro del worktree. Instala las dependencias en él si el proyecto lo requiere.
6. `plans/` puede no existir en el worktree: lee y actualiza el plan en el directorio principal, sin incluirlo en los commits de tareas.

## Paso 2: entorno de pruebas

Usa el framework de tests que ya tenga el proyecto. Si no tiene, propón uno al usuario antes de instalarlo y, si lo acepta, configúralo en su propio commit previo (`chore(test): ...`). Ejecuta la suite una vez para conocer la línea base y avisa si ya hay tests rotos.

## Paso 3: bucle por tarea (TDD estricto)

Procesa las tareas en orden, sin saltarte ninguna. Para cada `T<n>`:

1. 🔴 **Rojo:** escribe un test del resultado verificable de la tarea, ejecútalo y comprueba que falla por la razón esperada (no por error de sintaxis o import).
2. 🟢 **Verde:** escribe el código mínimo que lo haga pasar, respetando la arquitectura y las convenciones de `CLAUDE.md`. Ejecuta toda la suite: todo en verde.
3. 🔵 **Refactor:** limpia sin cambiar comportamiento y vuelve a ejecutar la suite.
4. **Commit:** `git add` de archivos concretos (nunca `-A`), mensaje en Conventional Commits en español (con `!` si rompe compatibilidad). Un commit por tarea.
5. **Marca** `- [x] **T<n>**` en `plans/plan-<n>.md` (y el punto de "Documentación a actualizar" si lo completa).

Reglas:
- Prohibido escribir código de producción sin un test rojo previo.
- No avances con la suite en rojo ni dejes tests saltados.
- No cambies un test para que pase; si estaba mal, corrígelo y explícalo en el commit.
- Si la tarea ya está cubierta por tests anteriores, no fuerces código: indícalo y marca la tarea.
- Tareas de verificación manual: conviértelas en tests automatizados. Tareas de documentación: actualízalas y haz commit `docs: ...`, sin test.

## Paso 4: si algo se tuerce

- Si el plan es incorrecto o una tarea es mucho mayor de lo previsto, detente y consulta; no improvises cambios de diseño.
- Si un test no pasa tras un intento razonable, no fuerces el commit: informa con la salida del test.
- Nunca uses `--no-verify` ni reescribas commits sin permiso.

## Paso 5: cierre

1. Con todas las tareas en `[x]`, ejecuta la suite completa y comprueba que `git status` está limpio en el worktree.
2. Cambia **Estado** a `completado` en el plan.
3. No hagas push ni PR, y no elimines el worktree. Resume al usuario: rama, ruta del worktree, tareas y commits, resultado de la suite y desviaciones o dudas pendientes.
