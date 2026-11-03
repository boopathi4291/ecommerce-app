"""Add tenant ownership and per-store configuration."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

from app.models import Base


revision = "20261102_tenant_admin"
down_revision = None
branch_labels = None
depends_on = None


TENANT_COLUMNS = ("users", "products", "cart_items", "wishlist_items", "orders", "payment_attempts")


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())

    if "users" in tables:
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "tenant_id" not in columns:
            op.add_column("users", sa.Column("tenant_id", sa.String(length=36), nullable=True))
        if "role" not in columns:
            op.add_column("users", sa.Column("role", sa.String(length=24), nullable=False, server_default="customer"))

    for table in TENANT_COLUMNS:
        if table not in tables:
            continue
        columns = {column["name"] for column in inspect(bind).get_columns(table)}
        if "tenant_id" not in columns:
            op.add_column(table, sa.Column("tenant_id", sa.String(length=36), nullable=True))
        indexes = {index["name"] for index in inspect(bind).get_indexes(table)}
        tenant_index = f"ix_{table}_tenant_id"
        if tenant_index not in indexes:
            op.create_index(tenant_index, table, ["tenant_id"], unique=False)

    if "users" in tables:
        indexes = {index["name"] for index in inspect(bind).get_indexes("users")}
        for index_name in ("ix_users_email", "ix_users_mobile"):
            if index_name in indexes:
                op.drop_index(index_name, table_name="users")
        indexes = {index["name"] for index in inspect(bind).get_indexes("users")}
        for column in ("email", "mobile", "tenant_id"):
            index_name = f"ix_users_{column}"
            if index_name not in indexes:
                op.create_index(index_name, "users", [column], unique=False)
        unique_constraints = {constraint["name"] for constraint in inspect(bind).get_unique_constraints("users")}
        indexes = {index["name"] for index in inspect(bind).get_indexes("users")}
        for name, columns in (
            ("uq_users_tenant_email", ["tenant_id", "email"]),
            ("uq_users_tenant_mobile", ["tenant_id", "mobile"]),
        ):
            if name not in unique_constraints and name not in indexes:
                op.create_index(name, "users", columns, unique=True)


def downgrade() -> None:
    raise RuntimeError("Tenant migration downgrade is intentionally disabled; restore a database backup instead")