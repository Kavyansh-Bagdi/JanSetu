# scripts/dev_seed.py
from app.core.database import SessionLocal, engine, Base
from app.models.builder import Builder
from app.models.user import User
from app.models.employee import Employee

# Ensure tables exist (optional)
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # create builder if not exists
    b = db.query(Builder).filter(Builder.name == "ABC Constructions").first()
    if not b:
        b = Builder(name="ABC Constructions")
        db.add(b)
        db.commit()
        db.refresh(b)

    # helper to get-or-create a user and employee
    def get_or_create_user_and_employee(name, email, phone, post, employee_code):
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(name=name, email=email, phone=phone, hashed_password="devpass", user_type="employee")
            db.add(user)
            db.commit()
            db.refresh(user)

        emp = db.query(Employee).filter(Employee.user_id == user.user_id).first()
        if not emp:
            emp = Employee(user_id=user.user_id, post=post, department="Roads", location="CityX", employee_code=employee_code)
            db.add(emp)
            db.commit()
            db.refresh(emp)

        return user, emp

    u1, e1 = get_or_create_user_and_employee("Dev Manager", "manager@test", "9999999999", "Manager", "EMP-MGR-001")
    u2, e2 = get_or_create_user_and_employee("Dev Inspector", "inspector@test", "8888888888", "Inspector", "EMP-INS-002")

    print('Seeded builder id:', b.id)
    print('Seeded manager unique_id:', e1.unique_id, 'inspector unique_id:', e2.unique_id)
finally:
    db.close()