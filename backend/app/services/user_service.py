from pkgutil import get_data

import bcrypt
from app.db.database import db
from pymongo.errors import DuplicateKeyError
from datetime import datetime


def create_user(user_data):
    try:
        user = db.users.insert_one(user_data)
        return str(user.inserted_id)
    except DuplicateKeyError:
        return None
def create_user(user_data):
   
    existing_user = db.users.find_one({"email": user_data["email"]})

    if existing_user:
        return None

    # hash password
    hashed_password = bcrypt.hashpw(user_data["password"].encode(), bcrypt.gensalt())
    user_data["password"] = hashed_password.decode()
    user_data["created_at"] = datetime.utcnow()
    user = db.users.insert_one(user_data)
    return str(user.inserted_id)



