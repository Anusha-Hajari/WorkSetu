import socketio
from app.db.database import db
from bson import ObjectId

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

# ── CONNECT / DISCONNECT ──────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    try:
        session = await sio.get_session(sid)
        user_id = session.get("user_id") if session else None
        if user_id:
            db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"isOnline": False}})
            await sio.emit("user_status_change", {"user_id": user_id, "isOnline": False})
            print(f"User {user_id} set offline (disconnected)")
    except Exception as e:
        print(f"Error handling disconnect offline status: {e}")
    print(f"Client disconnected: {sid}")

# ── JOIN USER ROOM (for notifications) ──────────────────────────
@sio.on("join")
async def join_room(sid, user_id):
    await sio.enter_room(sid, user_id)
    await sio.save_session(sid, {"user_id": user_id})
    try:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"isOnline": True}})
        await sio.emit("user_status_change", {"user_id": user_id, "isOnline": True})
        print(f"{sid} joined room {user_id} and set online")

        # Check for active negotiations to welcome back user who just logged in
        active_jobs = list(db.jobs.find({
            "$or": [{"postedBy.id": user_id}, {"assignedTo": user_id}],
            "status": "work_undergoing"
        }))
        active_urgents = list(db.urgent_jobs.find({
            "$or": [{"posted_by": user_id}, {"selected_worker": user_id}],
            "status": "work_undergoing"
        }))

        if active_jobs or active_urgents:
            job_name = active_jobs[0].get("title") if active_jobs else active_urgents[0].get("title")
            job_id = active_jobs[0].get("_id") if active_jobs else active_urgents[0].get("_id")
            await sio.emit("new_notification", {
                "title": "Active Negotiation",
                "message": f"Welcome back! You have an active job in progress: '{job_name}'.",
                "link": f"/chat/{str(job_id)}"
            }, room=user_id)
    except Exception as e:
        print(f"Error handling online status/notifications on join: {e}")

# ── JOIN JOB ROOM (for job tracking) ───────────────────────────
@sio.on("join_job")
async def join_job(sid, data):
    job_id = data.get("job_id")
    if job_id:
        await sio.enter_room(sid, f"job_{job_id}")
        print(f"{sid} joined room job_{job_id}")

@sio.on("leave_job")
async def leave_job(sid, data):
    job_id = data.get("job_id")
    if job_id:
        await sio.leave_room(sid, f"job_{job_id}")

# ── CHAT: JOIN CHAT ROOM ────────────────────────────────────────
@sio.on("join_chat")
async def join_chat(sid, data):
    job_id = data.get("job_id")
    user_id = data.get("user_id")
    
    # Try session if not in data
    if not user_id:
        try:
            session = await sio.get_session(sid)
            user_id = session.get("user_id") if session else None
        except Exception:
            pass

    if job_id and user_id:
        try:
            # 1. Try urgent_jobs
            job = db.urgent_jobs.find_one({"_id": ObjectId(job_id)})
            if job:
                is_poster = job.get("posted_by") == user_id
                is_selected = job.get("selected_worker") == user_id
                if is_poster or is_selected:
                    await sio.enter_room(sid, f"chat_{job_id}")
                    print(f"Authorized user {user_id} joined chat room chat_{job_id}")
                else:
                    print(f"Unauthorized user {user_id} blocked from chat_{job_id}")
                return

            # 2. Try regular jobs
            job = db.jobs.find_one({"_id": ObjectId(job_id)})
            if job:
                poster_id = job.get("postedBy", {}).get("id")
                assigned_to = job.get("assignedTo")
                is_poster = poster_id == user_id
                is_assigned = assigned_to == user_id
                if is_poster or is_assigned:
                    await sio.enter_room(sid, f"chat_{job_id}")
                    print(f"Authorized user {user_id} joined chat room chat_{job_id}")
                else:
                    print(f"Unauthorized user {user_id} blocked from chat_{job_id}")
                return
        except Exception as e:
            print(f"Error authorizing chat join: {e}")

# ── TRACKER: JOIN TRACKER ROOM ──────────────────────────────────
@sio.on("join_tracker")
async def join_tracker(sid, data):
    booking_id = data.get("booking_id")
    if booking_id:
        await sio.enter_room(sid, f"tracker_{booking_id}")
        print(f"{sid} joined tracker {booking_id}")

@sio.on("leave_tracker")
async def leave_tracker(sid, data):
    booking_id = data.get("booking_id")
    if booking_id:
        await sio.leave_room(sid, f"tracker_{booking_id}")

# ── CHAT: SEND MESSAGE ──────────────────────────────────────────
@sio.on("send_message")
async def send_message(sid, data):
    job_id = data.get("job_id")
    sender = data.get("sender_id")
    message = data.get("message")

    if not job_id or not message:
        return

    # Save message in DB
    db.messages.insert_one({
        "job_id": job_id,
        "sender_id": sender,
        "message": message
    })

    # Broadcast to room
    await sio.emit(
        "receive_message",
        {
            "sender_id": sender,
            "message": message,
            "job_id": job_id
        },
        room=f"chat_{job_id}"
    )

# ── BROADCAST HELPERS ───────────────────────────────────────────
async def broadcast_new_urgent_job(job: dict):
    await sio.emit("new_urgent_job", job)

async def broadcast_job_update(job_id: str, data: dict):
    await sio.emit("job_update", data, room=f"job_{job_id}")

async def broadcast_job_status(job_id: str, status: str):
    """Notify everyone that a job's status has changed (e.g. taken)."""
    await sio.emit("job_status_change", {"job_id": job_id, "status": status})

async def broadcast_new_applicant(job_id: str, applicant: dict):
    await sio.emit("new_applicant", applicant, room=f"job_{job_id}")

async def notify_chat(job_id: str, message: dict):
    await sio.emit("receive_message", message, room=f"chat_{job_id}")
    
async def notify_tracker(booking_id: str, data: dict):
    await sio.emit("tracker_updated", data, room=f"tracker_{booking_id}")
    
async def notify_user(user_id: str, notification: dict):
    await sio.emit("new_notification", notification, room=user_id)

# ── LOCATION TRACKING ──────────────────────────────────────────
@sio.on("update_location")
async def update_location(sid, data):
    """
    data = { booking_id: str, lat: float, lon: float }
    """
    booking_id = data.get("booking_id")
    lat = data.get("lat")
    lon = data.get("lon")
    
    if booking_id and lat and lon:
        # Broadcast location to the tracker room
        await sio.emit("worker_location", {"lat": lat, "lon": lon}, room=f"tracker_{booking_id}")
        print(f"Location update for tracker {booking_id}: {lat}, {lon}")