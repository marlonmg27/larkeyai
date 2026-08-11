# Arreglar el botón de checkout oculto en las tarjetas de planes

## Qué pasa

El botón sí existe y sí funciona: en cada tarjeta hay un botón "Ir al checkout" (36 px de alto) que dispara el checkout de Stripe. El problema es puramente visual: la tarjeta se recorta.

Medido en el preview: cada tarjeta mide 453 px de alto, pero su contenido real ocupa 602 px. La tarjeta tiene recorte de desbordamiento activado, así que los últimos ~148 px — justo donde vive el botón — quedan cortados e invisibles. Eso coincide con tu captura: la tarjeta Standard termina en un espacio en blanco donde debería estar el botón.

Causa: el bloque de contenido de la tarjeta pide "altura completa" (`h-full`) aunque ya tiene encima el encabezado (icono, nombre, descripción). Header + contenido a altura completa = más alto que la tarjeta.

## Cambio

En `src/components/pricing/PlanCards.tsx`, en las cuatro tarjetas (Basic, Standard, Pro y Enterprise):

- Quitar `h-full` del `CardContent` y dejarlo como columna flexible que crece con su contenido (`flex flex-1 flex-col`).
- Hacer que la `Card` sea columna flexible de altura completa, para que las cuatro tarjetas sigan igualadas en altura y los botones queden alineados abajo.
- Mantener `flex-1` en la lista de beneficios para que el botón quede pegado al pie de la tarjeta.

No se toca la lógica de Stripe, ni las consultas a la base de datos, ni el texto de los planes. Solo layout.

## Verificación

Medir de nuevo en el preview que la altura de cada tarjeta iguale la de su contenido (sin recorte) y que los cuatro botones sean visibles, en desktop y en móvil.
