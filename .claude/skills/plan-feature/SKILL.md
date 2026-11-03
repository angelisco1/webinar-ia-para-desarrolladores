---
name: plan-feature
description: Planifica una issue (funcionalidad o bug) y guarda el plan detallado en un archivo local. Úsala cuando el usuario pida planificar o preparar el trabajo de una issue antes de programarlo. No implementa código.
argument-hint: <número de issue>
---

# Planificar una issue

Planifica la issue $ARGUMENTS y guarda el plan en `plans/plan-<n>.md`. **Solo planifica: no toques `src/`.**

## Pasos

1. Necesitas el número de issue (`123` o `#123`) y su contenido (título y descripción) pegado por el usuario. Si falta alguno, pídelo y detente.
2. Deduce si es feature o bug. Si hay ambigüedad real, pregunta lo imprescindible. En un bug, localiza la causa raíz leyendo el código.
3. Explora el código afectado: identifica primero la estructura y la arquitectura del proyecto y sigue el flujo de la funcionalidad por sus capas o módulos. Lee `CLAUDE.md` y los `docs/` relevantes. Respeta sus convenciones.
4. Lee [assets/template.md](assets/template.md) y rellénalo con las mismas secciones, orden y títulos. Si una sección no aplica, escribe "No aplica" y el motivo. En **Issue** pon `#<n>`.
5. Guarda el plan en `plans/plan-<n>.md` (si existe, pregunta antes de sobrescribirlo).
6. Resume al usuario: objetivo, nº de tareas, dudas abiertas y ruta del archivo, para que lo adjunte a la issue. No implementes.

## Tareas

Cada tarea es un **ciclo TDD completo y autónomo** (rojo → verde → refactor → commit), que `implement-plan` ejecuta de principio a fin antes de pasar a la siguiente.

- Cada tarea dura 5-10 min; si es más larga, divídela.
- Formato: ``- [ ] **T<n>** (~<5|10> min) — <comportamiento a conseguir> — `ruta/archivo.js` ``, con **test** y **código de producción** en la misma tarea. Si hace falta, añade como subpuntos el test que se escribe (🔴) y el cambio mínimo que lo pone en verde (🟢).
- Un único comportamiento verificable por tarea: el test de la tarea falla antes de implementarla y pasa después.
- **Prohibido** agrupar todos los tests al principio y todas las implementaciones después (p. ej. "T1-T4 tests, T5-T8 código"). Cada test va junto a su implementación, en su propia tarea y su propio commit.
- La única excepción son las tareas de **preparación** (instalar/configurar el framework de tests, helpers de test), que van primero y no llevan ciclo rojo/verde; cada una se verifica con una ejecución de comprobación.
- Orden por dependencias y según la arquitectura del proyecto (de lo más interno a lo más externo), terminando en documentación (tarea sin test, commit `docs:`).
- Incluye tareas de documentación si procede. Las verificaciones manuales se convierten en tests automatizados dentro de la tarea que corresponda.
- Bug: primera tarea = test que reproduce el bug (rojo) junto con su corrección; penúltima, comprobar regresiones con la suite completa.

## Redacción

- En español, concreto: rutas de archivos, funciones/componentes y ejemplos de uso o de entrada/salida.
- No afirmes nada del código sin haberlo leído.
