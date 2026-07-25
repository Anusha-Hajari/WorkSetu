from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import socketio

# Import routers FIRST
from app.routers import (
    auth_router, 
    user_router, 
    job_router, 
    application_router, 
    payment_router, 
    admin_router,
    urgent_router,
    ai_router,
    chat_router,
    booking_router,
    tracking_router,
    wallet_router,
    review_router,
    upload_router,
    dispute_router,
    kyc_router
)

from app.socket_manager import sio

# Create app
app = FastAPI(title="WorkSetu API", version="1.0.0")

# CORS MUST be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://worksetu.vercel.app",
        "https://*.vercel.app",
        "*"  # For testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SocketIO
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Include all routers AFTER CORS
app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_router.router, prefix="/api/users", tags=["Users"])
app.include_router(job_router.router, prefix="/api", tags=["Jobs"])
app.include_router(application_router.router, prefix="/api/applications", tags=["Applications"])
app.include_router(payment_router.router, prefix="/api/payment", tags=["Payment"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])
app.include_router(urgent_router.router, prefix="/api/urgent", tags=["Urgent Jobs"])
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI"])
app.include_router(chat_router.router, prefix="/api/chat", tags=["Chat"])
app.include_router(booking_router.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(tracking_router.router, prefix="/api/tracking", tags=["Tracking"])
app.include_router(wallet_router.router, prefix="/api/wallet", tags=["Wallet"])
app.include_router(review_router.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(upload_router.router, prefix="/api", tags=["Upload"])
app.include_router(dispute_router.router, prefix="/api/disputes", tags=["Disputes"])
app.include_router(kyc_router.router, prefix="/api/kyc", tags=["KYC"])

# Mount static uploads directory
_uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
_uploads_dir = os.path.normpath(_uploads_dir)
os.makedirs(_uploads_dir, exist_ok=True)
os.makedirs(os.path.join(_uploads_dir, "kyc"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")

# Root endpoint
@app.get("/")
def root():
    return {"message": "WorkSetu API is running!"}

# Health check endpoint
@app.get("/health")
def health():
    return {"status": "healthy", "service": "WorkSetu API"}

# Socket.io placeholder
@app.get("/socket.io/")
def socket_placeholder():
    return {"msg": "Socket.io not yet configured"}