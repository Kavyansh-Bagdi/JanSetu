# JanSetu Backend - Database Setup

This is the database setup for the JanSetu project using FastAPI, SQLAlchemy, and Alembic.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Configuration and settings
│   │   └── database.py        # Database connection and session
│   └── models/
│       ├── __init__.py
│       ├── user.py            # User model
│       ├── builder.py         # Builder model
│       ├── employee.py         # Employee model
│       ├── road.py            # Road model
│       ├── rating.py          # Rating model
│       └── review.py          # Review model
├── alembic/
│   ├── versions/              # Migration files
│   └── env.py                 # Alembic environment config
├── alembic.ini                # Alembic configuration
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── .env.example              # Example environment variables
└── README_DATABASE.md        # This file
```

## Database Schema

### Tables and Relationships

1. **User Table**
   - `user_id` (PK): Unique ID of the user
   - `name`: Name of the user
   - `age`: Age of the user
   - `total_contributions`: Total number of contributions made
   - Relationships: Has many ratings and reviews

2. **Builder Table**
   - `id` (PK): Unique ID of the builder
   - `name`: Builder or company name
   - `average_rating`: Average rating across all projects
   - `total_projects`: Number of projects completed
   - `hyperlink`: Link to builder profile or website
   - Relationships: Has many roads

3. **Employee Table**
   - `unique_id` (PK): Unique ID of the employee
   - `name`: Name of the employee
   - `post`: Designation/Post
   - `location`: Work location
   - Relationships: Manages many roads, maintains many roads

4. **Road Table**
   - `road_id` (PK): Unique identifier for the road
   - `coordinates`: JSON - Sequence of coordinate points of the road
   - `cost`: Total construction cost (DECIMAL)
   - `started_date`: Construction start date
   - `ended_date`: Construction end date
   - `builder_id` (FK): References Builder(id)
   - `employee_id` (FK): References Employee(unique_id)
   - `maintained_by` (FK): References Employee(unique_id)
   - `chief_engineer`: Name of the chief engineer
   - `date_verified`: Date the road was verified
   - Relationships: Belongs to builder, has employee, has maintainer, has many ratings and reviews

5. **Rating Table**
   - `rating_id` (PK): Unique ID of the rating entry
   - `road_id` (FK): References Road(road_id)
   - `user_id` (FK): References User(user_id)
   - `rating`: Rating value (DECIMAL 1-5)
   - `date`: Date of rating
   - `location`: Location where rating was given
   - Relationships: Belongs to road and user

6. **Review Table**
   - `review_id` (PK): Unique ID of the review
   - `road_id` (FK): References Road(road_id)
   - `user_id` (FK): References User(user_id)
   - `media`: Attached image/video link
   - `tags`: Tags related to the review
   - `timestamp`: Time when the review was posted
   - Relationships: Belongs to road and user

## Setup Instructions

### 1. Environment Setup

Copy the example environment file (optional for SQLite default):

```bash
cp .env.example .env
```

The default configuration uses SQLite with a local database file `jansetu.db`:
```
DATABASE_URL=sqlite:///./jansetu.db
```

For production with PostgreSQL, update `.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/jansetu_db
```

### 2. Database Creation

**For SQLite (Default - Prototype):**
No manual database creation needed! The database file will be created automatically when you run migrations.

**For PostgreSQL (Production):**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE jansetu_db;

# Exit psql
\q
```

### 3. Generate Initial Migration

Create the first migration with all your models:

```bash
# Activate virtual environment
source .venv/bin/activate

# Generate migration
alembic revision --autogenerate -m "Initial migration with all tables"
```

### 4. Apply Migrations

Run the migrations to create all tables:

```bash
alembic upgrade head
```

### 5. Verify Database

**For SQLite:**
```bash
# Check that database file was created
ls -lh jansetu.db

# Or use sqlite3 to inspect tables
sqlite3 jansetu.db ".tables"
```

**For PostgreSQL:**
```bash
psql -U username -d jansetu_db -c "\dt"
```

## Common Alembic Commands

```bash
# Create a new migration (autogenerate based on model changes)
alembic revision --autogenerate -m "description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Show current migration version
alembic current

# Show migration history
alembic history

# Rollback to specific revision
alembic downgrade <revision_id>
```

## Development Workflow

1. **Make model changes** in `app/models/`
2. **Generate migration**: `alembic revision --autogenerate -m "description"`
3. **Review migration file** in `alembic/versions/`
4. **Apply migration**: `alembic upgrade head`
5. **Test your changes**

## Running the Application

```bash
# Activate virtual environment
source .venv/bin/activate

# Run the FastAPI server
python main.py

# Or use uvicorn directly
uvicorn main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Notes

- All models use SQLAlchemy ORM
- Foreign key relationships are properly defined
- Cascade deletes are configured where appropriate
- The `coordinates` field in Road table uses JSON type for storing coordinate arrays
- Date fields use SQLAlchemy's `Date` type
- DateTime fields use SQLAlchemy's `DateTime` type
- Decimal fields for ratings and costs use appropriate precision

## Next Steps

After database setup, you can:
1. Create Pydantic schemas for request/response validation
2. Implement CRUD operations for each model
3. Create API routers for each resource
4. Add authentication and authorization
5. Implement business logic
