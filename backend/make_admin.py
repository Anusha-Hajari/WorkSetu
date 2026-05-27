from app.db.database import db

email = "anu.pawan.jyoti.bansal@gmail.com"

result = db.users.update_one(
    {"email": email},
    {"$set": {"is_admin": True}}
)

if result.modified_count > 0:
    print(f"SUCCESS — {email} is now admin!")
    print("Now go to: http://localhost:5173/admin/login")
else:
    user = db.users.find_one({"email": email})
    if user:
        print(f"User found — is_admin is already: {user.get('is_admin')}")
        print("You can already login at: http://localhost:5173/admin/login")
    else:
        print("ERROR — User not found in database")