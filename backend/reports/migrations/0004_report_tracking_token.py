import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0003_category_name_pt"),
    ]

    operations = [
        # TiDB does not support ALTER TABLE … ADD COLUMN with a UNIQUE
        # constraint on tables that already contain rows.  We work around
        # this by splitting the operation:
        #
        #   1. State operations  – tell Django the field has unique=True
        #      so future makemigrations does not detect a mismatch.
        #   2. Database operations – add the column (no unique), then
        #      create the unique index via a separate DDL statement.
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.AddField(
                    model_name="report",
                    name="tracking_token",
                    field=models.UUIDField(default=uuid.uuid4, editable=False),
                ),
                migrations.RunSQL(
                    "CREATE UNIQUE INDEX reports_report_tracking_token_uniq "
                    "ON reports_report (tracking_token);",
                    reverse_sql="DROP INDEX reports_report_tracking_token_uniq "
                    "ON reports_report;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="report",
                    name="tracking_token",
                    field=models.UUIDField(
                        default=uuid.uuid4, editable=False, unique=True
                    ),
                ),
            ],
        ),
    ]
