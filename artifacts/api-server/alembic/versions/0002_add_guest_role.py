# =============================================================================
# Synaptiq — Synaptic Applications
# Copyright (c) 2026 Synaptic Applications (Itkdaniel). MIT License.
#
# alembic/versions/0002_add_guest_role.py
# Adds the 'guest' value to the user_role PostgreSQL enum.
# Existing rows are unchanged (admin/user roles are preserved).
# New users default to 'guest' (handled in application code).
# =============================================================================

"""Add guest role to user_role enum

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-16 00:00:00.000000
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL requires a specific sequence to add an enum value:
    # ALTER TYPE ... ADD VALUE is transactional in Postgres 12+.
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'guest'")


def downgrade() -> None:
    # Removing an enum value in PostgreSQL requires recreating the type.
    # Rows with role='guest' must be migrated first.
    op.execute("""
        UPDATE users SET role = 'user' WHERE role = 'guest'
    """)
    op.execute("""
        ALTER TYPE user_role RENAME TO user_role_old
    """)
    op.execute("""
        CREATE TYPE user_role AS ENUM ('admin', 'user')
    """)
    op.execute("""
        ALTER TABLE users ALTER COLUMN role TYPE user_role
            USING role::text::user_role
    """)
    op.execute("DROP TYPE user_role_old")
