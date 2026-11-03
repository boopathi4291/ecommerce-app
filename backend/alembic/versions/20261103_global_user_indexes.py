"""Preserve global account uniqueness after tenant-scoped uniqueness."""

from alembic import op
from sqlalchemy import inspect, text


revision = "20261103_global_user_indexes"
down_revision = "20261102_tenant_admin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    indexes = {index["name"] for index in inspect(bind).get_indexes("users")}
    if "uq_users_global_email" not in indexes:
        op.create_index(
            "uq_users_global_email", "users", ["email"], unique=True,
            sqlite_where=text("tenant_id IS NULL"),
            postgresql_where=text("tenant_id IS NULL"),
        )
    if "uq_users_global_mobile" not in indexes:
        op.create_index(
            "uq_users_global_mobile", "users", ["mobile"], unique=True,
            sqlite_where=text("tenant_id IS NULL"),
            postgresql_where=text("tenant_id IS NULL"),
        )


def downgrade() -> None:
    op.drop_index("uq_users_global_email", table_name="users")
    op.drop_index("uq_users_global_mobile", table_name="users")