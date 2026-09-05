# Arreglar el error de datos estructurados en Precios

Google marca como crítico el campo "offers" de la página de precios porque hoy contiene un
catálogo (`OfferCatalog`), y en un `Product` ese campo solo admite `Offer` o `AggregateOffer`.

## Qué se cambia

En los datos estructurados de `/es/precios` y `/en/pricing`:

- El campo `offers` pasa a ser un `AggregateOffer` válido:
  - moneda MXN, precio más bajo (2,000) y más alto (48,000) calculados de los planes reales
  - `offerCount` con el número de opciones
  - dentro, la lista de cada plan como `Offer` individual (Basic, Standard y Pro, mensual y anual),
    cada uno con su precio, moneda, disponibilidad y enlace a la página de precios
- Se conserva el nombre, la descripción, la marca y la URL del producto, y el texto localizado
  de cada opción en español e inglés.
- Se mantiene el `BreadcrumbList` de la página sin cambios.

## Sobre los dos avisos no críticos

"Falta aggregateRating" y "falta review" son opcionales. No se agregan: inventar calificaciones o
reseñas que no existen va contra las políticas de Google y puede provocar una penalización. Cuando
haya reseñas reales de clientes, se pueden añadir.

## Detalles técnicos

- `src/i18n/seo.ts`: `productJsonLd` deja de emitir `OfferCatalog` y emite
  `AggregateOffer` con `priceCurrency`, `lowPrice`, `highPrice`, `offerCount` y `offers[]` de tipo
  `Offer` (se conserva `UnitPriceSpecification` por oferta para mensual/anual).
- No se tocan las rutas `src/routes/es/precios.tsx` ni `src/routes/en/pricing.tsx`.

El cambio solo se refleja en la dirección pública después de publicar, y Google puede tardar
unos días en revalidar.
