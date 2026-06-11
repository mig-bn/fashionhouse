# ROADMAP — FashionHouse Boutique ERP + Ecommerce

> Última actualización: 2026-05-17 | Autor: Arquitecto principal

---

## Resumen ejecutivo

| Ítem | Detalle |
|------|---------|
| **Estado actual** | 100% completo (todas las fases implementadas) |
| **Fundación** | DB schema (18 tablas) ✅ · Infra Docker ✅ · Arquitectura hexagonal ✅ · MinIO ✅ |
| **Pendiente externo** | Credenciales bot (Meta Business + Telegram BotFather) para activar webhooks |
| **Total de fases** | 6 fases (0 → 5) + Fase 6 opcional |
| **Fase activa** | Ninguna — en standby para Fase 6 o activación del bot |
| **Módulos completos** | Cotizaciones ✅ · Bot WA/TG ✅ · CRM ✅ · KPIs ✅ |

### Progreso por fase
```
FASE 0 — Fundación Backend        [✅] 100%  (completada 2026-05-15)
FASE 1 — Ecommerce Core           [✅] 100%  (completada 2026-05-15)
FASE 2 — Módulo Cotizaciones      [✅] 100%  (completada 2026-05-15)
FASE 3 — CRM Clientes Confianza   [✅] 100%  (completada 2026-05-16)
FASE 4 — Bot WhatsApp + Telegram  [✅] 100%  (completada 2026-05-17, credenciales pendientes)
FASE 5 — KPIs y Dashboard Admin   [✅] 100%  (completada 2026-05-17)
```

---

## FASE 0 — Fundación Backend *(prerequisito de todo)*

### Objetivo
Levantar el backend con ORM funcional, seguridad JWT completa y endpoints de autenticación. Sin esta fase nada más puede construirse.

### Entregables

**Migraciones:**
- ✅ Flyway agregado al proyecto (`flyway-core` + `flyway-database-postgresql`)
- ✅ `V1__baseline.sql` — baseline vacío (el schema ya existe vía Docker init)
- ✅ `V2__add_quotations.sql` — 3 tablas quotations (completada en Fase 2)

**Entidades JPA** (`infrastructure/persistence/entity/`):
- ✅ `UserEntity` — tabla `users`
- ✅ `RefreshTokenEntity` — tabla `refresh_tokens`
- ✅ `CustomerEntity` — tabla `customers`
- ✅ `CategoryEntity` — tabla `categories` (auto-referencial)
- ✅ `ProductEntity` — tabla `products`
- ✅ `ProductVariantEntity` — tabla `product_variants`
- ✅ `ProductImageEntity` — tabla `product_images`
- ✅ `OrderEntity` — tabla `orders`
- ✅ `OrderItemEntity` — tabla `order_items`
- ✅ `InventoryMovementEntity` — tabla `inventory_movements`
- ✅ `PaymentEntity` — tabla `payments`
- ✅ `PaymentMethod` enum — dominio (`domain/model/payment/`)

**Repositorios** (`infrastructure/persistence/repository/`):
- ✅ `UserRepository`, `RefreshTokenRepository`, `CustomerRepository`
- ✅ `CategoryRepository`, `ProductRepository`, `ProductVariantRepository`, `ProductImageRepository`
- ✅ `OrderRepository`, `OrderItemRepository`, `InventoryMovementRepository`, `PaymentRepository`

**Seguridad** (`infrastructure/security/`):
- ✅ `JwtService` — generación y validación de tokens con JJWT 0.12.5
- ✅ `JwtAuthFilter` — `OncePerRequestFilter` extrae Bearer token de cabecera
- ✅ `SecurityConfig` — `SecurityFilterChain`, `BCryptPasswordEncoder`, CORS
- ✅ `UserDetailsServiceImpl` — carga usuario por email para Spring Security

**Aplicación** (`application/service/`):
- ✅ `AuthService` — register / login / refresh / logout (con hash SHA-256 de refresh tokens)

**REST** (`interfaces/rest/`):
- ✅ DTOs: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `RefreshRequest`
- ✅ `AuthController` — POST `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`

### Criterios de aceptación
- `mvn spring-boot:run` levanta sin errores con `ddl-auto: validate`
- `POST /api/auth/register` crea usuario y retorna `{ accessToken, refreshToken, user }`
- `POST /api/auth/login` con credenciales válidas retorna tokens JWT
- `POST /api/auth/refresh` con refresh token válido retorna nuevo access token
- Endpoint protegido retorna `401` sin token y `200` con token válido
- `GET /swagger-ui.html` muestra todos los endpoints documentados

### Archivos a crear/modificar
```
backend/pom.xml                                              (modificar: +Flyway)
backend/src/main/resources/application.yml                   (modificar: +Flyway config)
backend/src/main/resources/db/migration/V1__baseline.sql     (crear)
backend/src/main/java/com/fashionhouse/
  infrastructure/
    persistence/
      entity/          (11 archivos nuevos)
      repository/      (11 archivos nuevos)
    security/
      JwtService.java
      JwtAuthFilter.java
      SecurityConfig.java
      UserDetailsServiceImpl.java
  application/
    service/
      AuthService.java
  interfaces/
    rest/
      dto/auth/
        LoginRequest.java
        RegisterRequest.java
        AuthResponse.java
      controller/
        AuthController.java
```

### Estimación de esfuerzo
> 4-6 horas de desarrollo · Complejidad: Media

---

## FASE 1 — Ecommerce Core *(PRIORIDAD MÁXIMA)*

### Objetivo
El cliente puede navegar el catálogo, agregar productos al carrito y completar un checkout con pago real o simulado.

### Entregables

**Backend:**
- [ ] CRUD completo de categorías (con jerarquía)
- [ ] CRUD completo de productos + variantes + imágenes (upload a MinIO)
- [ ] Endpoint catálogo público con filtros (categoría, precio, talla, color) y paginación
- [ ] Endpoint detalle de producto
- [ ] Gestión de inventario: deducción automática al confirmar orden
- [ ] CRUD de órdenes + flujo de estados (`OrderStatus` ya tiene máquina de estados)
- [ ] Endpoint de creación de orden (checkout) con validación de stock
- [ ] Integración **MercadoPago** (pasarela adecuada para MX/CO: PSE, OXXO, tarjetas)
  - SDK: `com.mercadopago:sdk-java:2.1.24`
  - Implementar `PaymentGatewayPort` con el SDK de MercadoPago
  - Webhook receptor para confirmación asíncrona de pagos
- [ ] Endpoint historial de órdenes del cliente autenticado

**Frontend:**
- [ ] Página catálogo `/catalogo` con grid de productos, filtros y paginación
- [ ] Página detalle de producto `/productos/[slug]` con variantes y galería
- [ ] Carrito lateral (conectar `cartStore` existente con UI)
- [ ] Flujo de checkout `/checkout` (dirección de envío + pago)
- [ ] Página de confirmación `/orden/[id]`
- [ ] Historial de órdenes del cliente `/mis-ordenes`
- [ ] Formularios de login y registro (activar React Hook Form + Zod instalados)

### Criterios de aceptación
- Un usuario anónimo puede navegar el catálogo
- Un usuario registrado puede completar un checkout end-to-end
- El stock se reduce al confirmar la orden
- Se genera un registro de pago con estado `COMPLETED` o `PENDING`
- El cliente puede ver el estado de su orden en tiempo real

### Archivos a crear/modificar
```
backend:
  infrastructure/
    payment/MercadoPagoAdapter.java
    storage/ (MinioStorageAdapter ya existe — agregar endpoints de upload)
  application/service/
    ProductService.java · CategoryService.java · OrderService.java · InventoryService.java
  interfaces/rest/controller/
    ProductController.java · CategoryController.java · OrderController.java
    PaymentController.java (webhook MercadoPago)
  interfaces/rest/dto/product/ · dto/order/ · dto/payment/

frontend/src/
  app/(public)/catalogo/page.tsx
  app/(public)/productos/[slug]/page.tsx
  app/(public)/checkout/page.tsx
  app/(public)/orden/[id]/page.tsx
  app/(auth-required)/mis-ordenes/page.tsx
  app/(auth)/login/page.tsx (formulario real)
  app/(auth)/register/page.tsx (formulario real)
  components/
    catalog/ · cart/ · checkout/ · orders/
  lib/api/
    products.ts · orders.ts · auth.ts
```

### Estimación de esfuerzo
> 3-4 días de desarrollo · Complejidad: Alta

---

## FASE 2 — Módulo de Cotizaciones *(PRIORIDAD MÁXIMA)*

### Objetivo
El cliente puede solicitar ropa a la medida especificando medidas, referencias visuales y descripción. La boutique responde con precio y tiempo de entrega estimado.

### Entregables

**Base de datos:**
- ✅ `V2__add_quotations.sql` — 3 tablas nuevas:
  - `quotations` — cliente, descripción, medidas (JSONB), estado, precio propuesto, fecha entrega estimada
  - `quotation_messages` — hilo interno de mensajes (remitente, texto, adjuntos)
  - `quotation_images` — imágenes de referencia subidas por el cliente

**Máquina de estados de cotización:**
```
DRAFT → PENDING → IN_REVIEW → QUOTED → ACCEPTED → IN_PRODUCTION → READY → DELIVERED
                                     ↘ REJECTED
```

**Backend:**
- ✅ `QuotationEntity`, `QuotationMessageEntity`, `QuotationImageEntity`
- ✅ `QuotationStatus` enum con lógica de transiciones (`canTransitionTo`)
- ✅ `SenderType` enum (CUSTOMER / STAFF)
- ✅ `QuotationRepository`, `QuotationMessageRepository`, `QuotationImageRepository`
- ✅ DTOs: `QuotationSummaryDto`, `QuotationDetailDto`, `QuotationMessageDto`, `QuotationImageDto`
- ✅ DTOs request: `CreateQuotationRequest`, `RespondQuotationRequest`, `AddMessageRequest`
- ✅ `QuotationService` — crear, actualizar estado, responder, listar, mensajes, imágenes
- ✅ Upload de imágenes de referencia a MinIO (bucket `quotation-images`)
- ✅ `QuotationController` — CRUD + cambio de estado + mensajes + imágenes
- ✅ `EmailAdapter` (Spring JavaMailSender) implementando `EmailPort` con notificaciones
- ✅ `QuotationStateException` — excepción de dominio para transiciones inválidas

**Frontend:**
- ✅ `lib/api/quotations.ts` — cliente API completo
- ✅ Formulario de solicitud `/cotizaciones/nueva` (medidas, descripción, mensaje inicial)
- ✅ Panel de seguimiento del cliente `/mis-cotizaciones` con estado visual (chips de color)
- ✅ Vista detalle `/mis-cotizaciones/[id]` con hilo de mensajes + upload de imágenes
- ✅ `AdminSidebar` — navegación real con todos los módulos
- ✅ Panel admin `/admin/cotizaciones` — tabla con filtro por estado
- ✅ Vista admin detalle `/admin/cotizaciones/[id]` — formulario de respuesta + hilo de mensajes

### Criterios de aceptación
- Cliente envía solicitud con medidas y fotos de referencia
- Admin ve la solicitud en su panel y puede responder con precio
- Cliente recibe notificación y puede aceptar o rechazar
- Todas las transiciones de estado son válidas según la máquina de estados
- Historial completo de mensajes entre cliente y boutique

### Archivos a crear/modificar
```
backend:
  infrastructure/persistence/entity/
    QuotationEntity.java · QuotationMessageEntity.java · QuotationImageEntity.java
  domain/model/quotation/QuotationStatus.java
  application/service/QuotationService.java
  interfaces/rest/controller/QuotationController.java
  interfaces/rest/dto/quotation/
  src/main/resources/db/migration/V2__add_quotations.sql

frontend/src/
  app/(public)/cotizaciones/nueva/page.tsx
  app/(auth-required)/mis-cotizaciones/page.tsx
  app/(auth-required)/mis-cotizaciones/[id]/page.tsx
  app/admin/cotizaciones/page.tsx
  app/admin/cotizaciones/[id]/page.tsx
  components/quotations/
  lib/api/quotations.ts
```

### Estimación de esfuerzo
> 2-3 días de desarrollo · Complejidad: Media-Alta

---

## FASE 3 — CRM: Clientes de Confianza

### Objetivo
Usuarios VIP con vista 360° de sus pedidos y cotizaciones. Equipo interno con panel de gestión de clientes y métricas de relación.

### Entregables

**Base de datos:**
- ✅ `V4__add_crm.sql`:
  - `customer_notes` — notas internas por cliente (autor, texto, fecha)
  - Columnas `trusted_client`, `whatsapp_phone`, `loyalty_points`, `internal_tags` en `customers`
  - Constraint `users_role_check` actualizado para incluir `TRUSTED_CLIENT`

**Backend:**
- ✅ Rol `TRUSTED_CLIENT` agregado al enum `Role`
- ✅ `CustomerNoteEntity` — entidad JPA + `CustomerNoteRepository`
- ✅ `CustomerEntity` actualizado con los nuevos campos CRM
- ✅ `CustomerRepository` con `findByTrustedClientTrue`, `findAllByOrderByCreatedAtDesc`
- ✅ `OrderRepository` con `countByCustomerId`, `sumTotalByCustomerId`, `findLastOrderDateByCustomerId`
- ✅ `QuotationRepository` con `countByCustomerId`, `findByCustomerIdOrderByCreatedAtDesc`
- ✅ `CustomerService` — `getMyAccount`, `toggleTrustedClient`, `addNote`, `updateTags`, métricas LTV
- ✅ `CustomerController` — `GET /api/me`, `PATCH /api/me`, `GET/PATCH /api/admin/customers/**`
- ✅ DTOs: `MyAccountDto`, `CustomerSummaryDto`, `CustomerDetailDto`, `CustomerNoteDto`, `AddNoteRequest`, `UpdateCustomerRequest`

**Frontend — Dashboard cliente (`/mi-cuenta`):**
- ✅ Resumen KPIs: órdenes totales, cotizaciones activas, total comprado
- ✅ Órdenes recientes con estado visual
- ✅ Cotizaciones activas con estado en máquina de estados
- ✅ Botón "Hablar con un asesor" → link directo a WhatsApp
- ✅ CTA para solicitar nueva cotización

**Frontend — Panel CRM admin (`/admin/clientes`):**
- ✅ Lista de clientes con avatar, métricas LTV, # órdenes, # cotizaciones, última orden
- ✅ Filtro por VIP / todos + búsqueda por nombre/email/teléfono
- ✅ Vista detalle `/admin/clientes/[id]`:
  - Strip de KPIs (órdenes, cotizaciones, LTV, puntos)
  - Información de contacto completa
  - Sistema de etiquetas internas (add/remove)
  - Órdenes recientes + cotizaciones recientes linkadas
  - Notas internas con autoría y fecha
  - Botón WhatsApp directo al cliente
  - Toggle VIP con actualización de rol en BD

### Criterios de aceptación
- Admin puede ver lista de clientes con métricas en tiempo real
- Admin puede agregar notas internas y etiquetas a un cliente
- Cliente de confianza ve su historial completo en su dashboard
- El botón "Hablar con asesor" abre WhatsApp/Telegram directamente

### Archivos a crear/modificar
```
backend:
  domain/model/user/Role.java            (modificar: +TRUSTED_CLIENT)
  infrastructure/persistence/entity/     (CustomerNoteEntity, CustomerTagEntity)
  application/service/CustomerService.java
  interfaces/rest/controller/CustomerController.java

frontend/src/
  app/(auth-required)/mi-cuenta/page.tsx
  app/admin/clientes/page.tsx
  app/admin/clientes/[id]/page.tsx
  components/crm/
  lib/api/customers.ts
  src/main/resources/db/migration/V3__add_crm.sql
```

### Estimación de esfuerzo
> 2-3 días de desarrollo · Complejidad: Media

---

## FASE 4 — Bot WhatsApp + Telegram ✅ COMPLETA

> Implementada 2026-05-17. Falta activar los webhooks con credenciales reales (Meta Business + BotFather).

### Objetivo
Automatizar la primera línea de atención al cliente. El bot responde consultas de estado de pedido/cotización y transfiere a humano cuando no puede resolver.

### Entregables

**Base de datos:**
- ✅ `V6__add_bot.sql`:
  - `bot_interactions` — canal (WHATSAPP|TELEGRAM), phone/chat_id, mensaje entrante, respuesta, intención detectada, transferido (bool), timestamp
  - `phone_verifications` — vinculación número ↔ user_id

**Nuevo módulo Spring Boot** (`infrastructure/bot/`):
- ✅ `WhatsAppWebhookController` — recibe eventos de WhatsApp Business API (Meta Cloud API)
  - Verificación de webhook (`GET` con `hub.verify_token`)
  - Procesamiento de mensajes entrantes (`POST`)
- ✅ `TelegramWebhookController` — recibe updates del Telegram Bot API
- ✅ `BotIntentResolver` — lógica de intención simple:
  - Detecta: "pedido", "orden", "order" → consulta estado de orden
  - Detecta: "cotización", "cotizacion", "medida" → consulta estado de cotización
  - Detecta: "asesor", "humano", "hablar" → transfiere a humano
  - Default (no reconocido) → transfiere a humano
- ✅ `CustomerLookupService` — busca cliente por número de teléfono en BD
- ✅ `WhatsAppSenderService` — envía mensajes via Meta Graph API (graceful degradation sin credenciales)
- ✅ `TelegramSenderService` — envía mensajes via Telegram Bot API (graceful degradation sin credenciales)
- ✅ `HumanHandoffService` — notifica al grupo interno de staff

**Configuración:**
- ✅ Variables de entorno: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_STAFF_CHAT_ID`
- ✅ `application.yml` — sección `bot:` con todas las configs (valores vacíos por defecto)

**Frontend admin (`/admin/bot`):**
- ✅ Lista de conversaciones bot con estado (automático / transferido / resuelto)
- ✅ Vista detalle de conversación con opción de marcar como resuelto
- ✅ Indicador en tiempo real de conversaciones pendientes de atención humana (badge en sidebar)

### Flujo de transferencia a humano
```
1. Bot detecta intención de asesor O no reconoce el mensaje
2. Bot responde al cliente: "En breve uno de nuestros asesores te atenderá 🙏"
3. Bot envía notificación al grupo de staff con: nombre cliente + canal + mensaje + link directo
4. Registro en bot_interactions con transferred=true
```

### Criterios de aceptación
- Webhook de WhatsApp pasa verificación de Meta
- Webhook de Telegram recibe y responde mensajes correctamente
- El bot responde el estado de un pedido/cotización en < 3 segundos
- La transferencia a humano notifica al staff correctamente
- Todas las interacciones quedan registradas en BD

### Archivos a crear/modificar
```
backend:
  infrastructure/bot/
    WhatsAppWebhookController.java
    TelegramWebhookController.java
    BotIntentResolver.java
    CustomerLookupService.java
    WhatsAppSenderService.java
    TelegramSenderService.java
    HumanHandoffService.java
  application/service/BotInteractionService.java
  infrastructure/persistence/entity/BotInteractionEntity.java
  interfaces/rest/dto/bot/
  src/main/resources/db/migration/V4__add_bot.sql

frontend/src/
  app/admin/bot/page.tsx
  app/admin/bot/[id]/page.tsx
  components/bot/
  lib/api/bot.ts
```

### Estimación de esfuerzo
> 3-4 días de desarrollo · Complejidad: Alta

---

## FASE 5 — KPIs y Dashboard Admin ✅ COMPLETA

> Implementada 2026-05-17.

### Objetivo
Visibilidad completa del negocio para el dueño de la boutique: ventas, productos estrella, conversión de cotizaciones, y márgenes de éxito.

### Entregables

**Queries analíticas** (PostgreSQL nativo):
- ✅ Ventas por período (día, semana, mes, año) con comparativa
- ✅ Top 10 productos más vendidos (por unidades y por ingresos)
- ✅ Tasa de conversión: cotizaciones → órdenes aceptadas
- ✅ Ticket promedio por período
- ✅ Tiempo promedio de entrega (desde creación hasta `DELIVERED`)
- ✅ Clientes nuevos vs. recurrentes por período
- ✅ Revenue por categoría de producto
- ✅ Estado del inventario: productos con bajo stock (< 5 unidades)

**Backend:**
- ✅ `AnalyticsService` — métodos para cada KPI con parámetros de rango de fecha
- ✅ `AnalyticsController` — GET `/api/admin/analytics/*` (solo rol ADMIN)
- ✅ DTOs de respuesta optimizados para consumo en charts

**Frontend:**
- ✅ Dashboard principal `/admin` — KPIs resumidos en tarjetas
- ✅ Página de reportes `/admin/reportes` con:
  - Gráfico de ventas por período (LineChart — Recharts)
  - Gráfico de top productos (BarChart — Recharts)
  - Tasa de conversión cotización→venta (PieChart — Recharts)
  - Tabla de bajo inventario con alertas
- ✅ Exportación a CSV de: ventas por período, top productos, clientes activos

### Criterios de aceptación
- Dashboard admin carga en < 2 segundos con datos reales
- Todos los charts son interactivos (tooltip, zoom)
- La exportación CSV genera el archivo correctamente
- Los KPIs se actualizan al cambiar el rango de fechas
- Solo el rol ADMIN puede acceder a analytics

### Archivos a crear/modificar
```
backend:
  application/service/AnalyticsService.java
  interfaces/rest/controller/AnalyticsController.java
  interfaces/rest/dto/analytics/

frontend:
  package.json                           (agregar: recharts)
  app/admin/page.tsx                     (reemplazar placeholder actual)
  app/admin/analytics/page.tsx
  components/analytics/
    SalesChart.tsx · TopProductsChart.tsx
    ConversionChart.tsx · InventoryAlertTable.tsx
  lib/api/analytics.ts
```

### Estimación de esfuerzo
> 2 días de desarrollo · Complejidad: Media

---

## Dependencias entre fases

```
FASE 0 (Auth + ORM)
    │
    ├──→ FASE 1 (Ecommerce Core)
    │         │
    │         ├──→ FASE 2 (Cotizaciones)
    │         │         │
    │         │         └──→ FASE 3 (CRM)
    │         │                   │
    │         │                   └──→ FASE 4 (Bot WA/TG)
    │         │
    │         └──→ FASE 5 (KPIs) ← depende de datos reales de FASE 1+2
    │
    └── [FASE 1 y FASE 2 pueden desarrollarse en paralelo una vez lista FASE 0]
```

**Regla:** Fase N nunca puede iniciarse sin que Fase N-1 cumpla sus criterios de aceptación, salvo los pares (1,2) que pueden ir en paralelo.

---

## Decisiones técnicas tomadas

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | **MercadoPago** como pasarela de pago | Soporte nativo MX/CO: PSE, OXXO, Visa/MC. SDK Java oficial maduro |
| 2 | **Flyway** para migraciones | No había gestor; permite versionar cambios de schema a partir de Fase 0 |
| 3 | **JPA entities separadas del dominio** | Respeta la arquitectura hexagonal: domain puro, persistence en infra |
| 4 | **Bot en módulo Spring Boot** (no microservicio) | Evita overhead operacional en MVP; fácil extracción posterior |
| 5 | **Telegram grupo** como canal de notificación interna de staff | Sin costo, API simple, todos los asesores en un grupo |
| 6 | **Recharts** para charts del dashboard | Biblioteca React más popular, tamaño razonable, fácil customización |
| 7 | **JSONB** para medidas de cotización | Estructura flexible sin migraciones al agregar nuevas medidas |
| 8 | **Webhook único por canal** para el bot | Meta y Telegram usan modelos push; no necesitamos polling |

---

## Decisiones pendientes del equipo

- [ ] **Credenciales MercadoPago**: ¿cuenta sandbox para pruebas disponible?
- [ ] **WhatsApp Business**: ¿número de teléfono registrado en Meta Business Manager?
- [ ] **Telegram Bot**: ¿nombre del bot creado en BotFather?
- [ ] **Email SMTP**: ¿cuenta Gmail/SendGrid para notificaciones configurada?
- [ ] **Dominio productivo**: ¿URL donde se desplegará? (necesaria para webhooks Meta)
- [ ] **Cobertura de envíos**: ¿solo local (ciudad), nacional, o internacional?
- [ ] **Política de devoluciones**: ¿qué estados permiten iniciar un reembolso?
