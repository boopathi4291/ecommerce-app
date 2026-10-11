# ecommerce-app
End-to-end e-commerce application for selling products online with authentication and OAuth implementation

## Phase-one checkout

The frontend cart, checkout, and order pages are a local demo. Cart and demo orders are stored in the current browser session. Payment method choices (UPI, PayPal, Zelle, online banking, and card) do not initiate a real payment, and the checkout does not collect card, bank, UPI, or PayPal credentials. The demo outcome selector can exercise confirmed, declined, and timeout states; only its simulated confirmed state creates an order and tracking code.

Do not enable this flow for real payments. A production gateway integration needs a trusted backend to create provider payment intents with idempotency keys, keep the order pending until a signature-verified provider webhook confirms the amount and currency, and reconcile ambiguous timeouts against the provider before retrying. If a provider confirms capture after the order is cancelled, the backend must issue and verify an idempotent refund through that same provider. A browser timeout cannot safely determine whether money moved or perform a refund. Zelle is a peer-to-peer transfer service and does not guarantee merchant purchase protection or reversible payments; it should not be used as a standard e-commerce gateway.
