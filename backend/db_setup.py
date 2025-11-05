import sqlite3
import json
import os

DB_NAME = 'data.db'

# --- Remove old DB if needed (optional during development) ---
if os.path.exists(DB_NAME):
    os.remove(DB_NAME)
    print("Old database removed.")

# --- Connect to SQLite database ---
conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()

# ------------------------------
# Create Tables
# ------------------------------
cursor.execute('''
CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('manager','inspector')) NOT NULL
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS Manager (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    FOREIGN KEY(user_id) REFERENCES User(id)
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS Inspector (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    FOREIGN KEY(user_id) REFERENCES User(id)
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS Builder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    chief_engineer TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS Road (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    polyline TEXT, -- JSON-encoded coordinates
    builder_id INTEGER,
    manager_id INTEGER,
    inspector_id INTEGER,
    status TEXT CHECK(status IN ('planned', 'under construction', 'maintaining')) 
           NOT NULL DEFAULT 'planned',
    FOREIGN KEY(builder_id) REFERENCES Builder(id),
    FOREIGN KEY(manager_id) REFERENCES Manager(id),
    FOREIGN KEY(inspector_id) REFERENCES Inspector(id)
)
''')

conn.commit()
print("✅ Tables created successfully!")


# ------------------------------
# Insert Dummy Data
# ------------------------------
# Users
users = [
    ("Alice Manager", "alice.manager@example.com", "manager"),
    ("Bob Inspector", "bob.inspector@example.com", "inspector"),
    ("Charlie Manager", "charlie.manager@example.com", "manager"),
    ("Diana Inspector", "diana.inspector@example.com", "inspector")
]

cursor.executemany('''
INSERT INTO User (name, email, role)
VALUES (?, ?, ?)
''', users)
conn.commit()

# Fetch users
cursor.execute("SELECT id, role FROM User")
users_data = cursor.fetchall()

# Separate IDs
manager_user_ids = [uid for uid, role in users_data if role == "manager"]
inspector_user_ids = [uid for uid, role in users_data if role == "inspector"]

# Managers
for uid in manager_user_ids:
    cursor.execute("INSERT INTO Manager (user_id) VALUES (?)", (uid,))

# Inspectors
for uid in inspector_user_ids:
    cursor.execute("INSERT INTO Inspector (user_id) VALUES (?)", (uid,))

# Builders
builders = [
    ("Highway Constructions Ltd", "Er. Ramesh Kumar"),
    ("Urban Roads Pvt Ltd", "Er. Kavita Mehta"),
    ("GreenBuild Infrastructure", "Er. Aditya Singh")
]
cursor.executemany('''
INSERT INTO Builder (name, chief_engineer)
VALUES (?, ?)
''', builders)

conn.commit()
conn.close()
print("🎉 Database setup completed successfully!")
