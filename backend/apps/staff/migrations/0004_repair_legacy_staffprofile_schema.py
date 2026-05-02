from django.db import migrations


def repair_staffprofile_schema(apps, schema_editor):
    connection = schema_editor.connection
    table_name = "staff_staffprofile"

    with connection.cursor() as cursor:
        description = connection.introspection.get_table_description(cursor, table_name)
        existing_columns = {column.name for column in description}

    statements = []

    if "role" not in existing_columns:
        statements.append(
            "ALTER TABLE staff_staffprofile ADD COLUMN role varchar(20) NOT NULL DEFAULT 'nurse'"
        )
    if "weekly_limit_hours" not in existing_columns:
        statements.append(
            "ALTER TABLE staff_staffprofile ADD COLUMN weekly_limit_hours integer NOT NULL DEFAULT 40"
        )
    if "phone" not in existing_columns:
        statements.append(
            "ALTER TABLE staff_staffprofile ADD COLUMN phone varchar(20) NOT NULL DEFAULT ''"
        )
    if "gender" not in existing_columns:
        statements.append(
            "ALTER TABLE staff_staffprofile ADD COLUMN gender varchar(20) NOT NULL DEFAULT 'unspecified'"
        )
    if "cannot_work_night" not in existing_columns:
        statements.append(
            "ALTER TABLE staff_staffprofile ADD COLUMN cannot_work_night bool NOT NULL DEFAULT 0"
        )
    if "is_new_mother" not in existing_columns:
        statements.append(
            "ALTER TABLE staff_staffprofile ADD COLUMN is_new_mother bool NOT NULL DEFAULT 0"
        )

    for statement in statements:
        schema_editor.execute(statement)

    if "weekly_hour_limit" in existing_columns and "weekly_limit_hours" in {
        *existing_columns,
        "weekly_limit_hours",
    }:
        schema_editor.execute(
            """
            UPDATE staff_staffprofile
            SET weekly_limit_hours = CAST(COALESCE(weekly_hour_limit, 40) AS integer)
            WHERE weekly_limit_hours IS NULL OR weekly_limit_hours = 40
            """
        )


class Migration(migrations.Migration):
    dependencies = [
        ("staff", "0003_staffprofile_gender_and_shift_preferences"),
    ]

    operations = [
        migrations.RunPython(repair_staffprofile_schema, migrations.RunPython.noop),
    ]
