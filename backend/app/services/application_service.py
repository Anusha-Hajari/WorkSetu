from pkgutil import get_data

from app.db.database import db
from datetime import datetime



def apply_job(data):
    # check duplicate apply
    existing = db.applications.find_one({
        "user_email": data["user_email"],
        "job_id": data["job_id"]
    })

    if existing:
        return None

    application = db.applications.insert_one(data)
    return str(application.inserted_id)
def get_user_applications(email):
    apps = list(db.applications.find({"user_email": email}))

    for app in apps:
        app["_id"] = str(app["_id"])
        app["created_at"] = str(app.get("created_at", ""))
        app["status"] = app.get("status", "pending")
    return apps