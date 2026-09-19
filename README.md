# MiniERP

MiniERP es una aplicación empresarial pequeña para gestionar productos, clientes, cotizaciones y boletas con React, TypeScript, Vite y Vitest.

## Ejecución

```bash
npm install
npm run dev
```

Credenciales mock: `admin@minierp.local` / `Admin123*`.

## Arquitectura

La UI es delgada y consume servicios de aplicación organizados por feature en `src/modules/{auth,products,customers,quotations,receipts}`. Cada feature contiene sus capas `domain`, `repositories`, `services`, `pages` y `components`; `src/app` contiene layout/router y `src/shared` contiene tipos, errores y utilidades. Los repositorios en memoria implementan interfaces genéricas y se inicializan desde `src/data/*.json`; los seeds nunca se modifican físicamente.

## Módulos y reglas

Productos y clientes tienen CRUD, unicidad, validación de formatos y desactivación cuando existe referencia histórica. Las cotizaciones calculan subtotal, descuento, IGV (18%) y total, y controlan el flujo DRAFT → ISSUED → ACCEPTED/REJECTED/EXPIRED. Las boletas sólo se emiten desde cotizaciones aceptadas, validan stock de todos los items de forma atómica, descuentan inventario al emitir y se anulan mediante estado CANCELLED.

## Calidad

`npm test` ejecuta las pruebas unitarias exclusivas de Vitest. `npm run test:coverage` mide la lógica de `domain`, `services`, `repositories` y `shared` con umbrales del 100%. `npm run lint` y `npm run build` validan calidad y compilación. Se excluyen únicamente tipos y bootstrap/UI presentacional, que no contienen reglas de negocio.
