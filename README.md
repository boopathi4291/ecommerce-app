# HomeComing

HomeComing is an ecommerce prototype with a Next.js frontend and a FastAPI backend. Backend development is on branch `feature/fastapi-backend`, based on the pushed UI commit.

## FastAPI development

```sh
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API documentation is available at `http://localhost:8000/docs`; liveness and database readiness are `/healthz` and `/readyz`. The development default is SQLite. The Docker Compose backend uses PostgreSQL. `Base.metadata.create_all` is currently used for prototype startup; add and run Alembic migrations before deploying schema changes to production.

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

Signup/login use Argon2 password hashing and short-lived JWT access tokens with rotating, server-revocable refresh tokens. Cart, wishlist, and orders are scoped to the authenticated user. Checkout totals are recalculated from database prices, converted server-side to currency minor units, and protected by provider idempotency keys. Only a signature-verified provider webhook or an authenticated provider-side reconciliation response with matching amount and currency can confirm payment and create tracking details. Repeated webhook events are deduplicated.

## Frontend integration

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` in the frontend environment, then run `npm run dev` in `frontend`. The login/signup forms, catalog, cart, wishlist, checkout session creation, payment status, and order detail view call FastAPI. Public product browsing falls back to the bundled mock catalog if the API is unavailable; protected actions do not fall back to browser-local fake authentication or cart data.

## Payments and production security

No live gateway is configured in this repository. The default payment adapter is disabled, so checkout returns `503` and does not create an order or charge funds. UPI, PayPal, Zelle, online banking, and card choices are method identifiers only until a provider adapter is configured. Do not collect card, bank, UPI, or provider credentials in this frontend. A real integration must use provider-hosted/SDK payment fields, verified webhooks, provider status reconciliation after timeouts, and idempotent refunds. Zelle is peer-to-peer and does not provide typical merchant purchase protection or guaranteed reversible payments.

The fixed currency rates are prototype values; replace them with a trusted FX source before accepting payments. Production deployment also requires HTTPS, a unique secret of at least 32 characters, migrations, login/request rate limits at the API gateway, and configured OAuth redirect/callback URLs. The Compose JWT fallback is development-only and must not be used in production.

Run backend tests with:

```sh
cd backend
.venv/bin/python -m pytest
```

`docker compose up --build` starts the local PostgreSQL, Redis, FastAPI, and frontend services.
