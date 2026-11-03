# HomeComing

HomeComing is an ecommerce prototype with a Next.js frontend and FastAPI backend. Multi-tenant administration is developed on branch `feature/tenant-admin`, based on the FastAPI implementation.

## FastAPI development

```sh
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API documentation is available at `http://localhost:8000/docs`; liveness and database readiness are `/healthz` and `/readyz`. The development default is SQLite. The Docker Compose backend uses PostgreSQL. Alembic applies the tenant schema migration at startup; continue using versioned migrations for future schema changes.

## API routes

All application routes are under `/api/v1`.

| Area | Routes |
| --- | --- |
| Authentication | `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| OAuth | `GET /auth/oauth/{provider}/authorize` (returns `503` until provider credentials and callback configuration are supplied) |
| Products | `GET /products`, `GET /products/{product_id}` |
| Cart | `GET /cart`, `POST /cart/items`, `PUT /cart/items/{product_id}`, `DELETE /cart/items/{product_id}`, `DELETE /cart` |
| Wishlist | `GET /wishlist`, `PUT /wishlist/{product_id}`, `DELETE /wishlist/{product_id}` |
| Checkout | `POST /checkout` with an `Idempotency-Key` header |
| Payments | `GET /payments/{payment_id}`, `POST /payments/{payment_id}/reconcile`, `POST /payments/webhooks/{provider}` |
| Orders | `GET /orders`, `GET /orders/{order_id}`, `GET /orders/{order_id}/tracking`, `POST /orders/{order_id}/refund` with an `Idempotency-Key` header |
| Tenants | `POST /tenants`, `GET /tenants/{slug}`, `POST /tenants/{slug}/auth/login`, `POST /tenants/{slug}/auth/signup` |
| Tenant storefront | `GET /storefront/{slug}/products`, `GET /storefront/{slug}/products/{product_id}` |
| Tenant admin | `GET/PATCH /admin/tenant`, `GET/POST /admin/products`, `PATCH/DELETE /admin/products/{product_id}` |

Signup/login use Argon2 password hashing and short-lived JWT access tokens with rotating, server-revocable refresh tokens. Tenant admins are isolated by tenant ID and role; products, cart, wishlist, orders, branding, currency, and enabled payment methods are store-scoped. Checkout totals are recalculated from database prices, converted server-side to currency minor units, and protected by provider idempotency keys. Only a signature-verified provider webhook or an authenticated provider-side reconciliation response with matching amount and currency can confirm payment and create tracking details. Repeated webhook events are deduplicated.

## Frontend integration

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in the frontend environment, then run `npm run dev` in `frontend`. Create a store at `/register-store`; its owner gets `/{slug}/admin`, customer/admin sign-in is at `/{slug}/login`, and the public catalog is at `/{slug}/products`. The HomeComing root login has a store-slug opener. Public tenant products and all tenant admin changes use tenant-scoped API routes.

For example, `clientabc` uses `/clientabc/login`, `/clientabc/admin`, and `/clientabc/products`; another store gets its own equivalent path. This prototype routes by path slug on the shared host. Custom DNS domains and TLS provisioning are not included. Tenant registration creates an administrator and a private copy of the starter catalog. Admins can update store name/logo, theme colors, default currency, enabled payment methods, and their own product catalog. Gateway credentials are deliberately not accepted in the admin browser UI.

## Payments and production security

No live gateway is configured in this repository. The default payment adapter is disabled, so checkout returns `503` and does not create an order or charge funds. UPI, PayPal, Zelle, online banking, and card choices are method identifiers only until a provider adapter is configured. Do not collect card, bank, UPI, or provider credentials in this frontend. A real integration must use provider-hosted/SDK payment fields, verified webhooks, provider status reconciliation after timeouts, and idempotent refunds. Zelle is peer-to-peer and does not provide typical merchant purchase protection or guaranteed reversible payments.

The fixed currency rates are prototype values; replace them with a trusted FX source before accepting payments. Production deployment also requires HTTPS, a unique secret of at least 32 characters, migrations, login/request rate limits at the API gateway, and configured OAuth redirect/callback URLs. The Compose JWT fallback is development-only and must not be used in production.

Run backend tests with:

```sh
cd backend
.venv/bin/python -m pytest
```

`docker compose up --build` starts the local PostgreSQL, Redis, FastAPI, and frontend services.
