---
name: plan-feature
description: Planifica una issue de GitHub (funcionalidad o bug) leyéndola con gh, publica el plan detallado como comentario de la issue y avisa por Slack al canal webinar. Úsala cuando el usuario pida planificar o preparar el trabajo de una issue antes de programarlo. No implementa código.
argument-hint: <número de issue>
---

# Planificar una issue

Planifica la issue $ARGUMENTS del repositorio de GitHub, publica el plan como comentario de la issue y avisa por Slack. **Solo planifica: no toques `src/`.**

## Pasos

1. Necesitas el número de issue (`123` o `#123`). Si falta, pídelo y detente. Comprueba que `gh` está autenticado (`gh auth status`) y que estás en un repo con remoto de GitHub; si no, avisa y detente.
2. Lee la issue con `gh issue view <n> --json number,title,body,labels,state,url,comments`. Si no existe o está cerrada, avisa y pregunta antes de seguir. Lee también los comentarios: pueden aclarar o cambiar el alcance. Si ya hay un comentario de plan (empieza por `<!-- plan-feature -->`), pregunta si se reemplaza (se edita) o se añade uno nuevo.
3. Deduce si es feature o bug (por etiquetas y contenido). Si hay ambigüedad real, pregunta lo imprescindible. En un bug, localiza la causa raíz leyendo el código.
4. Explora el código afectado: identifica primero la estructura y la arquitectura del proyecto y sigue el flujo de la funcionalidad por sus capas o módulos. Lee `CLAUDE.md` y los `docs/` relevantes. Respeta sus convenciones.
5. Lee [assets/template.md](assets/template.md) y rellénalo con las mismas secciones, orden y títulos. Si una sección no aplica, escribe "No aplica" y el motivo. En **Issue** pon `#<n>`.
6. Escribe el plan en un archivo temporal (no en el repo), con esta primera línea: `<!-- plan-feature -->`. Publícalo con `gh issue comment <n> --body-file <archivo>` (o, si el usuario eligió reemplazar, `gh api -X PATCH repos/{owner}/{repo}/issues/comments/<id> -F body=@<archivo>`). Guarda la URL del comentario.
7. Avisa por Slack (ver abajo).
8. Resume al usuario: objetivo, nº de tareas, dudas abiertas y URL del comentario. No implementes.

## Aviso por Slack

Usa las herramientas del MCP de Slack (si no están cargadas, búscalas con ToolSearch por "slack").

1. Localiza el canal `webinar` (búsqueda de canales; coincidencia exacta con `#webinar`). Si no lo encuentras o el MCP no está disponible, no inventes otro canal: avisa al usuario con el mensaje que habrías enviado y termina.
2. Envía un mensaje breve en español: `📝 Plan listo para la issue #<n> — <título>. <nº de tareas> tareas. <URL del comentario>`. Añade una línea con las dudas abiertas solo si las hay.
3. Un solo mensaje, sin menciones masivas (`@channel`, `@here`).

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
