from fastapi import APIRouter, HTTPException, Header
from app.db.database import db
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
import hashlib
import os

router = APIRouter()

SECRET_KEY = "worksetu_secret_key_2024"
ALGORITHM = "HS256"

class RegisterData(BaseModel):
    name: str
    email: str
    password: str

class LoginData(BaseModel):
    email: str
    password: str

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def hash_password(password: str) -> str:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )
    return salt.hex() + ":" + key.hex()

def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, key_hex = stored.split(":")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            100000
        )
        return key.hex() == key_hex
    except Exception:
        return False

@router.post("/register")
def register(data: RegisterData):
    try:
        existing = db.users.find_one({"email": data.email})
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        hashed = hash_password(data.password)

        new_user = {
            "name": data.name,
            "email": data.email,
            "password": hashed,
            "is_admin": False,
            "is_banned": False,
            "is_verified": False,
            "created_at": datetime.utcnow().isoformat(),
        }

        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
        token = create_token({"email": data.email, "id": user_id})

        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": data.name,
                "email": data.email,
                "is_admin": False,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"REGISTER ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(data: LoginData):
    try:
        db_user = db.users.find_one({"email": data.email})
        if not db_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not verify_password(data.password, db_user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if db_user.get("is_banned"):
            raise HTTPException(
                status_code=403,
                detail="Account suspended"
            )

        user_id = str(db_user["_id"])
        token = create_token({"email": db_user["email"], "id": user_id})

        return {
            "token": token,
            "user": {
                "id": user_id,
                "name": db_user["name"],
                "email": db_user["email"],
                "is_admin": db_user.get("is_admin", False),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
def get_me(authorization: str = Header(...)):
    try:
        parts = authorization.split()
        if len(parts) != 2:
            raise HTTPException(status_code=401, detail="Invalid header")
        token = parts[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        db_user = db.users.find_one({"email": email})
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "user": {
                "id": str(db_user["_id"]),
                "name": db_user["name"],
                "email": db_user["email"],
                "is_admin": db_user.get("is_admin", False),
            }
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")