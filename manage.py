#!/usr/bin/env python
import os
import sys
from pathlib import Path


def main() -> None:
    root_dir = Path(__file__).resolve().parent
    backend_dir = root_dir / "backend"
    os.chdir(backend_dir)
    sys.path.insert(0, str(backend_dir))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Could not import Django. Did you forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()

