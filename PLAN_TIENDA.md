# Plan de trabajo de la tienda JTP

Fecha: 2026-09-15. Estado: plan preparado; implementacion pendiente.

## Objetivo

Construir una tienda para productos y trabajos personalizados de impresion 3D,
grabado y corte laser. El administrador debe gestionar catalogo, imagenes,
existencias, cotizaciones, pedidos y produccion desde un mismo panel.

## Punto de partida verificado

- `src/routes/admin.tsx` contiene un prototipo de catalogo y galeria con
  persistencia localStorage. Crear un producto abre su editor.
- El acceso administrativo compara credenciales en el navegador. El indicador
  de confirmado NO demuestra la existencia de un administrador confirmado en
  Supabase. Debe reemplazarse antes de utilizar datos reales.
- Existen autenticacion de clientes, envio de cotizaciones y subida de archivos
  mediante Supabase. Su funcionamiento desplegado requiere verificacion.
- La migracion de quotes y profiles no crea una tabla de pedidos, aunque su
  nombre mencione orders. No hay un flujo completo de compra verificado.

## Referencias y capacidades seleccionadas

La seleccion responde a las necesidades de JTP; no es un ranking universal.

| Referencia oficial | Capacidad que adoptaremos |
| --- | --- |
| [Shopify: productos](https://help.shopify.com/en/manual/products) | Catalogo central, estados de publicacion y variantes |
| [Shopify: inventario](https://help.shopify.com/en/manual/products/inventory) | Existencias por variante e historial de ajustes |
| [WooCommerce: galeria](https://woocommerce.com/document/adding-product-images-and-galleries/) | Portada independiente, multiples imagenes y orden editable |
| [BigCommerce: cotizaciones](https://docs.bigcommerce.com/developer/learn/courses/b2b-core/purchasing/purchasing-entities) | Cotizaciones personalizadas y conversion a pedidos |

## Orden de ejecucion

### 1. Base de datos, identidad y permisos - P0

- Reutilizar Supabase Auth; proteger operaciones administrativas en servidor y
  mediante politicas RLS. Roles iniciales: administrador, operador y cliente.
- Crear migraciones incrementales para roles, productos, categorias, variantes,
  medios y movimientos de inventario; conservar las cotizaciones existentes.
- Crear un administrador de pruebas real en el entorno de pruebas mediante una
  operacion privilegiada del servidor. Verificar confirmacion y rol por separado;
  mantener las credenciales fuera del codigo y del paquete del navegador.
- Revisar permisos de cotizaciones: el cliente no puede aprobar su propio precio
  ni cambiar estados reservados al equipo.
- Ofrecer importacion explicita y validada de productos locales, sin publicar
  automaticamente datos de demostracion.

Criterios de cierre: un cliente no puede administrar productos ni leer archivos
ajenos; un administrador autorizado puede hacerlo; los datos sobreviven al cambio
de navegador. Registrar evidencia del usuario de pruebas confirmado sin secretos.

### 2. Catalogo y editor de productos - P0

- Crear, editar, duplicar, archivar y publicar productos; categorias, filtros,
  paginacion y acciones masivas con resultados y errores visibles.
- Nombre, SKU unico, descripcion, precio, moneda, categoria, portada y estado.
  Variantes por material, color o medida con precio y stock propios.
- Diferenciar producto de stock, servicio y trabajo bajo pedido. No mostrar un
  servicio como agotado por carecer de unidades fisicas.
- Abrir el editor al crear; guardar como borrador; permitir editar nuevamente;
  cancelar cambios y advertir antes de perder modificaciones pendientes.
- Validar datos en servidor y cliente; evitar sobrescrituras silenciosas entre
  operadores; usar importes decimales y restricciones de integridad.

Criterios de cierre: crear -> editar -> guardar -> recargar conserva los datos;
SKU duplicados y precios invalidos se rechazan; archivar conserva el historial.

### 3. Gestor de galeria - P0

- Subida multiple desde dispositivo, arrastrar y soltar, progreso, reintento y
  validacion de formato, peso y dimensiones.
- Biblioteca reutilizable; portada, orden por arrastre y controles de teclado,
  texto alternativo, vista ampliada y asociacion de imagenes a variantes.
- Miniaturas y carga diferida; tratamiento de imagenes fallidas y estados vacios.
- Separar medios publicos de productos y archivos privados de clientes; retirar
  una imagen de un producto sin borrar archivos usados por otros productos.

Criterios de cierre: subir, ordenar, cambiar portada y retirar imagenes funciona
en movil y escritorio y persiste tras recargar; archivos privados siguen privados.

### 4. Tienda publica e inventario - P0

- Conectar escaparate y fichas al mismo catalogo persistente; mostrar unicamente
  productos publicados, con busqueda, categorias y seleccion de variantes.
- Registrar entradas, salidas y ajustes con motivo; umbral de stock bajo.
- Separar stock disponible, reservado y comprometido. Reservas atomicas con
  vencimiento y liberacion al cancelar; politica definida para trabajos bajo pedido.

Criterios de cierre: publicar aparece en la tienda y pausar lo retira; dos compras
simultaneas de la ultima unidad no pueden venderla dos veces.

### 5. Cotizaciones, clientes y produccion - P1

- Bandeja administrativa con filtros, responsable, notas internas y detalle de
  material, cantidad, archivos, plazo, importe y vigencia.
- Estados y transiciones autorizadas: recibida, en revision, enviada, aceptada,
  rechazada y vencida. Conservar versiones de las propuestas.
- Convertir una cotizacion aceptada en un pedido una sola vez; conservar una
  copia de precios, descripciones y opciones aunque el catalogo cambie.
- Historial del cliente y tablero de produccion: pendiente, en produccion,
  control de calidad y listo. Separar estado de produccion, pago y entrega.

Criterios de cierre: cliente solicita -> equipo cotiza -> cliente acepta -> se
crea un unico pedido -> produccion avanza, con historial y archivos autorizados.

### 6. Carrito, pagos y entregas - P1

- Carrito persistente, resumen de compra y totales calculados en servidor.
- Integrar proveedor de pagos en modo de pruebas; verificar eventos firmados y
  procesarlos de forma idempotente. Nunca confirmar pago por volver a una URL.
- Descuentos con vigencia y limites, impuestos configurables, recogida y envio,
  seguimiento, cancelaciones y reembolsos segun reglas de negocio acordadas.
- Correos transaccionales con reintento y registro de envio.

Criterios de cierre: compra aprobada, rechazada y cancelada verificadas; repetir
un evento de pago no duplica pedidos ni descuenta stock dos veces.

Dependencias externas: cuenta del proveedor, moneda comercial, jurisdiccion
fiscal, zonas/tarifas de entrega y dominio remitente. Avanzar en modo de pruebas
hasta disponer de configuracion real; no asumir estos datos por la ubicacion local.

### 7. Analitica, SEO y operacion - P2

- Panel con ventas cobradas, pedidos pendientes, cotizaciones por atender,
  productos mas vendidos y stock bajo; separar ventas del valor del inventario.
- Metadatos por producto, enlaces estables, sitemap y datos estructurados.
- Exportacion e importacion CSV con vista previa, validacion y reporte de errores.
- Registro de acciones administrativas, seguimiento de errores y procedimiento
  de respaldo/restauracion probado. Automatizaciones despues de estabilizar flujos.

Criterios de cierre: metricas conciliadas con pedidos/pagos de prueba; importacion
con errores no introduce datos parciales inesperados; restauracion comprobada.

## Arquitectura y entregas

Mantener React, TanStack Start, componentes existentes y Supabase. Dividir el panel
en modulos de catalogo, medios, inventario, cotizaciones y pedidos con contratos
compartidos; evitar concentrar toda la logica en `admin.tsx`. No incorporar otra
plataforma comercial completa sin una necesidad demostrada.

Cada fase requiere migracion cuando corresponda, interfaz funcional, estados de
carga/error/vacio, validaciones y pruebas de los riesgos que introduce. Ejecutar
build y revisar los flujos afectados en escritorio y movil. Para permisos,
inventario y pagos, incluir pruebas de acceso indebido, concurrencia e idempotencia.

Publicar entregas pequenas y verificadas en la rama conectada a Lovable, sin
reescribir historial publicado. Una fase no se considera terminada por tener solo
su interfaz: debe verificarse el flujo completo contra los servicios necesarios.

Primer hito: fases 1 a 4, administracion real de productos y galeria conectada a la
tienda. Segundo hito: fases 5 y 6, ciclo comercial completo. Tercer hito: fase 7.
El siguiente trabajo concreto es la fase 1; este documento no afirma que las
capacidades pendientes ya esten implementadas.
