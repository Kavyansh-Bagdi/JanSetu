# Quick Reference - Database Commands

## Using Alembic (IMPORTANT!)

Always use the virtual environment's Python to run alembic commands:

```bash
# Navigate to backend directory
cd /home/rishabh/coding/JanSetu/JanSetu/backend

# Generate a new migration after model changes
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python -m alembic revision --autogenerate -m "description of changes"

# Apply migrations
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python -m alembic upgrade head

# Rollback last migration
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python -m alembic downgrade -1

# Show current version
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python -m alembic current

# Show migration history
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python -m alembic history
```

## SQLite Commands

```bash
# View all tables
sqlite3 jansetu.db ".tables"

# View schema of a specific table
sqlite3 jansetu.db ".schema tablename"

# View all schemas
sqlite3 jansetu.db ".schema"

# Check database size
ls -lh jansetu.db

# Open SQLite interactive shell
sqlite3 jansetu.db

# In SQLite shell, useful commands:
# .tables - list all tables
# .schema - show all schemas
# .quit or .exit - exit the shell
# SELECT * FROM tablename; - query a table
```

## Running the FastAPI Server

```bash
# Run with uvicorn
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python -m uvicorn main:app --reload

# Or use python directly
/home/rishabh/coding/JanSetu/JanSetu/backend/.venv/bin/python main.py
```

## Created Tables

✅ **user** - User information and contributions
✅ **builder** - Construction companies/builders
✅ **manager** - Government managers/officials
✅ **road** - Road projects with coordinates and details
✅ **rating** - User ratings for roads
✅ **review** - User reviews with media for roads

All tables have been created with:
- Primary keys
- Foreign key relationships
- Proper indexes
- Cascade delete where appropriate
