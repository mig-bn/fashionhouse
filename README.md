# FashionHouse

A full-stack boutique e-commerce and CRM platform — Spanish-language storefront with catalog, cart, checkout, custom quotation requests, and an integrated admin panel for order, customer, and inventory management.

---

![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-object_storage-C72E49?logo=minio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Features

- **Product catalog** — browsable by category, with variants (size/color) and image gallery served from MinIO
- **Shopping cart & checkout** — client-side cart (Zustand) with MercadoPago payment integration
- **Order tracking** — customers can follow order status from confirmation through delivery
- **Custom quotation flow** — customers submit made-to-measure requests with images; staff replies inside a threaded conversation
- **CRM** — customer profiles, internal notes, loyalty points, trusted-client flag, WhatsApp phone, and tag system
- **Admin panel** — manage products, categories, orders, quotations, and customers behind a role-based dashboard
- **Analytics dashboard** — sales KPIs, revenue by category, top products, conversion rate, and low-stock alerts (Recharts)
- **Inventory management** — movement log tracks stock additions and deductions per SKU
- **JWT authentication** — stateless access + refresh token flow; roles: `ADMIN`, `STAFF`, `CUSTOMER`, `TRUSTED_CLIENT`
- **Bot infrastructure** — WhatsApp and Telegram webhook receivers with intent resolution and human-handoff logic (integration layer in place; messaging not yet fully wired)

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Backend | Spring Boot 3.3 / Java 21 | REST API, business logic |
| Frontend | Next.js 14 (App Router) | SSR + client-side SPA |
| Language (FE) | TypeScript 5.4 | Type safety |
| Database | PostgreSQL 16 | Primary data store |
| Migrations | Flyway | Schema versioning |
| ORM | Spring Data JPA (Hibernate) | Persistence layer |
| Object Storage | MinIO | Product & quotation images |
| Auth | JWT (jjwt 0.12.5) | Stateless auth with refresh tokens |
| Payments | MercadoPago SDK 2.1.24 | Checkout preference + webhook |
| Server State | TanStack React Query 5 | API data fetching & caching |
| Client State | Zustand 4 | Auth session + cart |
| Forms | React Hook Form + Zod | Form management & validation |
| Charts | Recharts 3 | Admin analytics dashboard |
| Styling | Tailwind CSS 3.4 | Utility-first CSS |
| Icons | Lucide React | UI icon set |
| HTTP Client | Axios 1.7 | API calls + auto token refresh |
| API Docs | SpringDoc OpenAPI 2.5 | Swagger UI at `/swagger-ui.html` |
| Containerization | Docker Compose | Local infrastructure orchestration |

---

## Architecture

The project is a **monorepo** with three independent modules:

```
fashionhouse/
├── backend/    # Spring Boot — Hexagonal (Ports & Adapters)
├── frontend/   # Next.js 14 — App Router
└── infra/      # Docker Compose (PostgreSQL + MinIO)
```

### Backend — Hexagonal Architecture

```
com.fashionhouse/
├── application/
│   ├── port/       # Interfaces: StoragePort, EmailPort, PaymentGatewayPort
│   └── service/    # Business logic: Auth, Product, Order, Quotation, Customer, Analytics, Inventory
├── domain/
│   ├── model/      # Enums & value objects: Role, OrderStatus, QuotationStatus, PaymentMethod
│   └── exception/  # Domain exceptions
├── infrastructure/
│   ├── persistence/  # 17 JPA entities + Spring Data repositories
│   ├── security/     # JWT filter, SecurityConfig, UserDetailsServiceImpl
│   ├── storage/      # MinioStorageAdapter
│   ├── payment/      # MercadoPagoAdapter
│   ├── email/        # EmailAdapter
│   └── bot/          # WhatsApp/Telegram senders, intent resolver, handoff
└── interfaces/
    └── rest/         # 12 REST controllers + DTOs
```

All API responses follow a uniform envelope:
```json
{ "success": true, "data": {}, "meta": { "page": 0, "totalPages": 1, "totalItems": 5 }, "timestamp": "..." }
```

### Frontend — Next.js App Router

Route groups enforce layout and access control:

| Group | Path prefix | Access |
|---|---|---|
| `(public)` | `/`, `/catalogo`, `/productos`, `/checkout`, `/cotizaciones`, `/orden` | Public |
| `(auth)` | `/login`, `/register` | Unauthenticated only |
| `(customer)` | `/mis-ordenes`, `/mis-cotizaciones`, `/mi-cuenta` | Authenticated customers |
| `admin` | `/admin/**` | `ADMIN` or `STAFF` role |

Edge middleware (`src/middleware.ts`) reads cookies to enforce redirects before any page renders.

---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** — for local infrastructure
- **Java 21** (JDK) — for the backend
- **Node.js 20+** and **npm** — for the frontend
- **Maven** wrapper is included (`./mvnw`), no separate install needed

### 1. Clone the repository

```bash
git clone https://github.com/mig-bn/fashionhouse.git
cd fashionhouse
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp infra/.env.example infra/.env
```

**Required variables** (never commit actual values):

| Variable | Used by | Description |
|---|---|---|
| `DB_USER` | PostgreSQL, Backend | Database username |
| `DB_PASSWORD` | PostgreSQL, Backend | Database password |
| `JWT_SECRET` | Backend | HS256 signing key (min 32 chars) |
| `MINIO_ACCESS_KEY` | MinIO, Backend | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO, Backend | MinIO secret key |
| `NEXTAUTH_SECRET` | Frontend | NextAuth session secret |
| `MAIL_HOST` | Backend | SMTP host |
| `MAIL_PORT` | Backend | SMTP port |
| `MAIL_USERNAME` | Backend | SMTP username |
| `MAIL_PASSWORD` | Backend | SMTP password |

**Backend-only variables** (set in shell or `backend/.env`):

| Variable | Description |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago API token |
| `MERCADOPAGO_SANDBOX` | `true` for test mode |
| `MERCADOPAGO_NOTIFICATION_URL` | Webhook URL for payment events |
| `MP_SUCCESS_URL` / `MP_FAILURE_URL` / `MP_PENDING_URL` | MercadoPago redirect URLs |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API token |
| `WHATSAPP_PHONE_ID` | WhatsApp sender phone ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_STAFF_CHAT_ID` | Chat ID for staff notifications |

**Frontend variable** (create `frontend/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Start infrastructure

```bash
cd infra
docker compose up -d
```

This starts PostgreSQL on port `5432` and MinIO on ports `9000` (API) / `9001` (console).

### 4. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

- API base: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`

A seeded admin account is created on first startup (credentials logged to console).

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

---

## Screenshots

<!-- TODO: Add screenshots of the storefront, admin dashboard, and quotation flow -->

| Storefront | Admin Dashboard | Quotation Flow |
|---|---|---|
| _coming soon_ | _coming soon_ | _coming soon_ |

---

## License

<!-- TODO: Add a LICENSE file. MIT is suggested if no other license applies. -->

This project does not currently include a license file. [MIT License](https://choosealicense.com/licenses/mit/) is recommended.
