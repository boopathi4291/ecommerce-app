from decimal import Decimal, ROUND_HALF_UP


# Phase-one fixed reference rates; replace with a trusted FX feed before production.
INR_PER_UNIT: dict[str, Decimal] = {
    "INR": Decimal("1"), "USD": Decimal("83"), "EUR": Decimal("90"),
    "GBP": Decimal("105"), "CAD": Decimal("61"), "AUD": Decimal("54"),
    "BRL": Decimal("16"), "MXN": Decimal("4.9"), "JPY": Decimal("0.56"),
    "KRW": Decimal("0.063"), "CHF": Decimal("95"), "NZD": Decimal("50"),
}
ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW"}


def currency_exponent(currency: str) -> int:
    return 0 if currency in ZERO_DECIMAL_CURRENCIES else 2


def inr_to_minor_units(amount_inr: int, currency: str) -> int:
    rate = INR_PER_UNIT.get(currency)
    if rate is None:
        raise ValueError(f"Unsupported currency: {currency}")
    exponent = currency_exponent(currency)
    amount = Decimal(amount_inr) / rate * (Decimal(10) ** exponent)
    return int(amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP))