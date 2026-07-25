import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Validate MongoDB URI
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set")

# Create MongoDB client with SSL options
try:
    # For SRV connection (mongodb+srv://)
    if MONGO_URI.startswith("mongodb+srv://"):
        client = MongoClient(
            MONGO_URI,
            tls=True,
            tlsAllowInvalidCertificates=True,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            serverSelectionTimeoutMS=30000
        )
    else:
        # For non-SRV connection
        client = MongoClient(
            MONGO_URI,
            tls=True,
            tlsAllowInvalidCertificates=True,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            serverSelectionTimeoutMS=30000
        )
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    
except ConnectionFailure as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("⚠️ Please check your MONGO_URI and network access")
    client = None

db = client[DB_NAME] if client else None

# Create indexes safely
def create_indexes():
    if db is None:
        print("❌ Cannot create indexes: No database connection")
        return
    
    try:
        # Create unique index on email
        db.users.create_index("email", unique=True)
        print("✅ Email index created successfully")
    except Exception as e:
        print(f"⚠️ Note: Index may already exist: {e}")

# Create indexes on startup
create_indexes()