# scripts/dev_seed.py
from app.core.database import SessionLocal, engine, Base
from app.models.builder import Builder
from app.models.user import User
from app.models.employee import Employee

# Ensure tables exist (optional)
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    b = Builder(name="ABC Constructions")
    db.add(b)
    db.commit()
    db.refresh(b)
    # create manager user & employee
    u1 = User(name="Dev Manager", email="manager@test", phone="9999999999", hashed_password="devpass", user_type="employee")
    db.add(u1)
    db.commit()
    db.refresh(u1)
    e1 = Employee(user_id=u1.user_id, post="Manager", department="Roads", location="CityX", employee_code="EMP-MGR-001")
    db.add(e1)
    # inspector
    u2 = User(name="Dev Inspector", email="inspector@test", phone="8888888888", hashed_password="devpass", user_type="employee")
    db.add(u2)
    db.commit()
    db.refresh(u2)
    e2 = Employee(user_id=u2.user_id, post="Inspector", department="Roads", location="CityX", employee_code="EMP-INS-002")
    db.add(e2)
    db.commit()
    print('Seeded builder id:', b.id)
    print('Seeded manager unique_id:', e1.unique_id, 'inspector unique_id:', e2.unique_id)
finally:
    db.close()