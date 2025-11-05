#!/usr/bin/env python3
"""
Mock Data Insertion Script for JanSetu Backend
Run this script to populate the database with test data.

Usage:
    python insert_mock_data.py
"""

import sqlite3
from datetime import datetime
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "jansetu.db"

# Mock password hash (password: "password")
MOCK_PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5kosg8CPrS6B6"


def insert_mock_data():
    """Insert mock data into the database."""
    
    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        print("Please run migrations first: alembic upgrade head")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🚀 Inserting mock data...")
        
        # Insert User 1: Common citizen user (Rishabh Kumar)
        cursor.execute("""
            INSERT INTO user (user_id, name, email, phone, hashed_password, age, user_type, total_contributions, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (1, 'Rishabh Kumar', 'rishabh.kumar@example.com', '+919876543210', 
              MOCK_PASSWORD_HASH, 25, 'citizen', 0, datetime.now(), datetime.now()))
        print("✅ Inserted User 1: Rishabh Kumar (Citizen)")
        
        # Insert User 2: Employee - Manager (Abhinav Gupta)
        cursor.execute("""
            INSERT INTO user (user_id, name, email, phone, hashed_password, age, user_type, total_contributions, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (2, 'Abhinav Gupta', 'abhinav.gupta@example.com', '+919876543211', 
              MOCK_PASSWORD_HASH, 35, 'employee', 0, datetime.now(), datetime.now()))
        print("✅ Inserted User 2: Abhinav Gupta (Employee)")
        
        # Insert Employee profile for User 2 (Manager)
        cursor.execute("""
            INSERT INTO employee (user_id, post, department, location, employee_code) 
            VALUES (?, ?, ?, ?, ?)
        """, (2, 'Manager', 'Public Works Department', 'Delhi', 'EMP001'))
        print("   └─ Employee profile created (Manager)")
        
        # Insert User 3: Employee - Inspector (Divyansh Pokharna)
        cursor.execute("""
            INSERT INTO user (user_id, name, email, phone, hashed_password, age, user_type, total_contributions, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (3, 'Divyansh Pokharna', 'divyansh.pokharna@example.com', '+919876543212', 
              MOCK_PASSWORD_HASH, 28, 'employee', 0, datetime.now(), datetime.now()))
        print("✅ Inserted User 3: Divyansh Pokharna (Employee)")
        
        # Insert Employee profile for User 3 (Inspector)
        cursor.execute("""
            INSERT INTO employee (user_id, post, department, location, employee_code) 
            VALUES (?, ?, ?, ?, ?)
        """, (3, 'Inspector', 'Public Works Department', 'Mumbai', 'EMP002'))
        print("   └─ Employee profile created (Inspector)")
        
        # Insert Builder 4: Kavyansh_Constructions
        cursor.execute("""
            INSERT INTO builder (id, name, email, phone, hashed_password, average_rating, total_projects, hyperlink) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (4, 'Kavyansh_Constructions', 'kavyansh.constructions@example.com', '+919876543213', 
              MOCK_PASSWORD_HASH, 4.5, 10, 'https://kavyansh-constructions.com'))
        print("✅ Inserted Builder 4: Kavyansh_Constructions")
        
        # Commit changes
        conn.commit()
        
        print("\n" + "="*60)
        print("📊 Data Summary:")
        print("="*60)
        
        # Display users
        cursor.execute("SELECT user_id, name, email, user_type FROM user")
        users = cursor.fetchall()
        print("\n👥 Users:")
        for user in users:
            print(f"   {user[0]}. {user[1]} ({user[3]}) - {user[2]}")
        
        # Display employees
        cursor.execute("SELECT unique_id, user_id, post, location FROM employee")
        employees = cursor.fetchall()
        print("\n👔 Employees:")
        for emp in employees:
            print(f"   ID {emp[0]}: User {emp[1]} - {emp[2]} @ {emp[3]}")
        
        # Display builders
        cursor.execute("SELECT id, name, email FROM builder")
        builders = cursor.fetchall()
        print("\n🏗️  Builders:")
        for builder in builders:
            print(f"   {builder[0]}. {builder[1]} - {builder[2]}")
        
        print("\n" + "="*60)
        print("✨ Mock data inserted successfully!")
        print("="*60)
        print("\n🔑 Login Credentials:")
        print("   Email: rishabh.kumar@example.com")
        print("   Email: abhinav.gupta@example.com")
        print("   Email: divyansh.pokharna@example.com")
        print("   Email: kavyansh.constructions@example.com")
        print("   Password (all): password")
        print("="*60)
        
    except sqlite3.IntegrityError as e:
        print(f"\n⚠️  Data already exists or integrity constraint violated: {e}")
        print("💡 Tip: Delete jansetu.db and run migrations again for a fresh start")
    except Exception as e:
        print(f"\n❌ Error inserting data: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    insert_mock_data()
