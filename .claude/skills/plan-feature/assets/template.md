# Plan: <título corto de la funcionalidad o bug>

- **Issue**: #<número>
- **Tipo**: feature | bugfix
- **Fecha**: <AAAA-MM-DD>
- **Estado**: pendiente

## 1. Contexto y objetivo

<Qué se quiere conseguir y por qué. En un bug: comportamiento actual vs. esperado y pasos para reproducirlo.>

## 2. Alcance

**Incluye**

- <qué entra en el plan>

**No incluye**

- <qué queda fuera a propósito>

## 3. Análisis del código actual

<Archivos, capas/módulos y funciones o componentes afectados, con sus rutas. En un bug, causa raíz identificada.>

## 4. Diseño de la solución

<Enfoque elegido y decisiones relevantes: interfaces o contratos afectados (endpoints, componentes, funciones), cambios en datos/esquemas, validaciones y gestión de errores. Alternativas descartadas si aportan contexto.>

## 5. Lista de tareas

Cada tarea dura 5-10 minutos y es un ciclo TDD completo: 🔴 test que falla → 🟢 código mínimo que lo pasa → 🔵 refactor → commit → tachar la tarea. No separes los tests de su implementación en tareas distintas. Solo las tareas de preparación del entorno de test (si hacen falta) y la documentación van sin ciclo rojo/verde. Ordénalas por dependencias, de lo más interno a lo más externo.

- [ ] **T1** (~5 min) — <preparación del entorno de test, si hace falta> — `ruta/config`
- [ ] **T2** (~10 min) — <comportamiento a conseguir> — `ruta/archivo.js`, `ruta/archivo.test.js`
  - 🔴 Test: <qué verifica y por qué falla ahora>
  - 🟢 Código: <cambio mínimo para pasarlo>
- [ ] **T3** (~5 min) — Documentación — `docs/...`

## 6. Plan de pruebas

<Cómo verificar el cambio: pasos o ejemplos con resultado esperado, casos límite y regresiones a comprobar, usando las herramientas de test que tenga el proyecto.>

## 7. Documentación a actualizar

- [ ] <CLAUDE.md, docs/..., u "ninguna">

## 8. Riesgos y dudas abiertas

- <riesgos, impacto en compatibilidad (cambios incompatibles) o preguntas pendientes>