# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**FashionHouse** is a boutique e-commerce + CRM platform (Spanish-language UI) with two distinct surfaces:
- **Public storefront** — catalog, product detail, cart, checkout, quotation requests, order tracking
- **Admin panel** — product/category/order management, CRM (customers), quotations, analytics

The stack is a **Next.js 14 frontend** + **Spring Boot 3.3 backend** + **PostgreSQL** + **MinIO** (object storage) + **MercadoPago** (payments).

---

## Development Commands

### Start infrastructure (required first)
```bash
cd infra && docker compose up -d
```
Starts PostgreSQL (port 5432) and MinIO (API 9000, console 9001). Requires `infra/.env` with `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`.

### Backend (Spring Boot / Java 21 / Maven)
```bash
cd backend
./mvnw spring-boot:run           # dev server on port 8080
./mvnw clean package             # build fat JAR
./mvnw clean package -DskipTests # build without tests
./mvnw test                      # run all tests
./mvnw test -Dtest=ClassName     # run a single test class
```

API docs: `http://localhost:8080/swagger-ui.html`  
Health: `http://localhost:8080/actuator/health`

### Frontend (Next.js 14 / Node / npm)
```bash
cd frontend
npm run dev        # dev server on port 3000
npm run build      # production build
npm run lint       # ESLint
npm run type-check # tsc --noEmit (no emitting, just type errors)
```

---

## Architecture

### Backend — Hexagonal (Ports & Adapters)

```
com.fashionhouse/
├── application/
│   ├── port/        # Interfaces: StoragePort, EmailPort, PaymentGatewayPort
│   └── service/     # All business logic: AuthService, ProductService, OrderService,
│                    # CategoryService, InventoryService, QuotationService,
│                    # CustomerService, AnalyticsService
├── domain/
│   ├── exception/   # Domain-specific exceptions (ResourceNotFoundException, etc.)
│   └── model/       # Enums/value objects: Role, OrderStatus, QuotationStatus,
│                    # PaymentMethod, SenderType
├── infrastructure/
│   ├── persistence/
│   │   ├── entity/      # 15 JPA entities (User, Customer, Product, ProductVariant,
│   │   │                # ProductImage, Category, Order, OrderItem, Payment,
│   │   │                # InventoryMovement, Quotation, QuotationMessage,
│   │   │                # QuotationImage, RefreshToken, CustomerNote)
│   │   └── repository/  # Spring Data JPA repositories + ProductSpecification
│   ├── security/    # JwtAuthFilter, JwtService, SecurityConfig, UserDetailsServiceImpl
│   ├── storage/     # MinioStorageAdapter (implements StoragePort)
│   ├── payment/     # MercadoPagoAdapter (implements PaymentGatewayPort)
│   ├── email/       # EmailAdapter (implements EmailPort)
│   └── config/      # DataSeeder (seeds admin user on startup), MinioConfig, OpenApiConfig
└── interfaces/
    └── rest/
        ├── controller/   # AuthController, ProductController, CategoryController,
        │                 # OrderController, PaymentController, QuotationController,
        │                 # CustomerController, AnalyticsController
        └── dto/          # ApiResponse<T> wrapper + per-domain DTOs
                          # (auth/, product/, order/, category/, quotation/,
                          #  customer/, payment/, analytics/)
```

**API response envelope:**
```json
{ "success": true, "data": <T>, "meta": { "page": 0, "totalPages": 1, "totalItems": 5 }, "timestamp": "..." }
```
Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": [] } }`

**JPA:** `ddl-auto=validate` — the DB schema must match entities exactly. Schema is managed by Flyway (`db/migration/`). All migrations run in order; V1 is a baseline-only placeholder since the actual schema is applied via `infra/postgres/init.sql`.

**Security:** Stateless JWT. `SecurityConfig` opens GET `/api/products/**`, GET `/api/categories/**`, all `/api/auth/**`, and `/api/payments/webhook/**`. Everything else requires authentication. Fine-grained admin permissions use `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` per method or controller class.

**Roles:** `ADMIN | STAFF | CUSTOMER | TRUSTED_CLIENT` — stored as `user_role` enum in Postgres.

### Frontend — Next.js 14 App Router

**Route groups:**
- `(auth)/` — login, register (no layout wrapping)
- `(public)/` — storefront with Navbar + Footer
- `(customer)/` — authenticated customer pages (mis-ordenes, mis-cotizaciones, mi-cuenta); layout provides Navbar
- `admin/` — admin panel with AdminSidebar; layout is `admin/layout.tsx`

**State management:**
- **Server state:** TanStack React Query (`@tanstack/react-query`) — all API calls go through query hooks
- **Client state:** Zustand — `authStore` (user/token/cookies) and `cartStore` (in-memory cart)

**Auth token storage:**
- `accessToken` → `sessionStorage['access-token']` (cleared on tab close)
- `refreshToken` → Cookie `refresh-token` (read by Next.js middleware)
- `userRole` → Cookie `user-role` (read by Next.js middleware)

**Middleware (`src/middleware.ts`):** Edge runtime. Reads cookies to enforce:
1. `/admin/**` requires `user-role = ADMIN|STAFF`
2. `/mis-ordenes`, `/mis-cotizaciones`, `/mi-cuenta` require any active session
3. ADMIN/STAFF landing on `/`, `/catalogo`, `/productos`, `/checkout`, `/cotizaciones` → redirect to `/admin`

**Axios client (`src/lib/api/client.ts`):**
- `baseURL = NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'`
- Request interceptor: reads `accessToken` from `sessionStorage`, injects `Authorization: Bearer`
- Response interceptor: on 401 (non-auth endpoints), auto-retries after refreshing via `POST /auth/refresh`; on refresh failure, redirects to `/login`
- **Important:** Auth endpoint 401s skip the refresh logic (guarded by `!url.includes('/auth/')`)

**API layer (`src/lib/api/`):** Each file (`auth.ts`, `products.ts`, `orders.ts`, `quotations.ts`, `customers.ts`, `analytics.ts`) exports a plain object with methods that call `apiClient` and return `.data` from the response.

---

## Key Configuration

### Backend environment variables
| Variable | Default | Notes |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/fashionhouse` | |
| `SPRING_DATASOURCE_USERNAME/PASSWORD` | `postgres` / `postgres` | |
| `JWT_SECRET` | **required** | min 32 chars |
| `MINIO_ENDPOINT` | `http://localhost:9000` | |
| `MINIO_ACCESS_KEY / SECRET_KEY` | — | matches `infra/.env` |
| `MINIO_BUCKET_PRODUCTS` | `product-images` | |
| `MINIO_BUCKET_QUOTATIONS` | `quotation-images` | |
| `MERCADOPAGO_ACCESS_TOKEN` | TEST placeholder | |

### Frontend environment variables
| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` |

### Seeded admin credentials (dev only)
- Email: `admin@fashionhouse.com`
- Password: `admin.123`

Logged on every backend startup: `=== DataSeeder === Admin → email: ... password: ...`

---

## Database Migrations

Flyway migrations in `backend/src/main/resources/db/migration/`:
- **V1** — Baseline placeholder (real schema in `infra/postgres/init.sql`)
- **V2** — Quotations module (quotations, quotation_messages, quotation_images)
- **V3** — Currency column type fix
- **V4** — CRM additions (customer_notes, trusted_client flag, whatsapp_phone, loyalty_points, internal_tags)
- **V5** — Admin password hash reset

New migrations must follow the `V{n}__description.sql` naming convention.

---

## Domain State Machines

**OrderStatus:** `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (any → `CANCELLED`). Transitions enforced in `OrderService.updateStatus()`.

**QuotationStatus:** `DRAFT → PENDING → IN_REVIEW → QUOTED → ACCEPTED → IN_PRODUCTION → READY → DELIVERED` (many → `REJECTED`). Transitions encoded in `QuotationStatus.allowedTransitions()`.

---

## Project Roadmap Status

Per `ROADMAP.md`:
- ✅ Phase 0 — Infrastructure (Docker, DB, MinIO)
- ✅ Phase 1 — Core e-commerce (catalog, cart, checkout, orders)
- ✅ Phase 2 — Custom quotation flow (ropa a la medida)
- ✅ Phase 3 — CRM (customer profiles, notes, trusted clients, loyalty)
- ⬜ Phase 4 — WhatsApp + Telegram bot (not started, defer to end)
- ✅ Phase 5 — Analytics KPIs (AnalyticsService + dashboard + Recharts reports)
- ⬜ Phase 6 — Advanced features (multi-currency, inventory projections)
