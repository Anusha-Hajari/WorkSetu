import socketio
from app.db.database import db

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
    print(f"Client disconnected: {sid}")

# ── JOIN USER ROOM (for notifications) ──────────────────────────
@sio.on("join")
async def join_room(sid, user_id):
    await sio.enter_room(sid, user_id)
    print(f"{sid} joined room {user_id}")

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
    if job_id:
        await sio.enter_room(sid, f"chat_{job_id}")
        print(f"{sid} joined chat for job {job_id}")

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