from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import urgent_router
import socketio
from app.socket_manager import sio
from app.routers import ai_router
from app.routers import chat_router
from app.routers import booking_router
app = FastAPI()
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
app.include_router(chat_router.router, prefix="/api", tags=["Chat"])

# CORS must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Import routers AFTER middleware
from app.routers import auth_router, job_router, application_router, payment_router, admin_router

try:
    from app.routers import user_router
    app.include_router(user_router.router, prefix="/api/users", tags=["Users"])
except Exception as e:
    print(f"user_router error: {e}")

app.include_router(auth_router.router,        prefix="/api/auth",         tags=["Auth"])
app.include_router(job_router.router,         prefix="/api",              tags=["Jobs"])
app.include_router(application_router.router, prefix="/api/applications", tags=["Applications"])
app.include_router(payment_router.router,     prefix="/api/payment",      tags=["Payment"])
app.include_router(admin_router.router,       prefix="/api/admin",        tags=["Admin"])
app.include_router(urgent_router.router, prefix="/api/urgent", tags=["Urgent Jobs"])
app.include_router(ai_router.router, prefix="/api/ai", tags=["AI"])
app.include_router(booking_router.router, prefix="/api/bookings", tags=["Bookings"])
from app.routers import tracking_router, wallet_router, review_router, upload_router, dispute_router, kyc_router
app.include_router(tracking_router.router, prefix="/api/tracking", tags=["Tracking"])
app.include_router(wallet_router.router, prefix="/api/wallet", tags=["Wallet"])
app.include_router(review_router.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(upload_router.router, prefix="/api", tags=["Upload"])
app.include_router(dispute_router.router, prefix="/api/disputes", tags=["Disputes"])
app.include_router(kyc_router.router, prefix="/api/kyc", tags=["KYC"])

# Mount static uploads directory
from fastapi.staticfiles import StaticFiles
import os
_uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
_uploads_dir = os.path.normpath(_uploads_dir)
os.makedirs(_uploads_dir, exist_ok=True)
os.makedirs(os.path.join(_uploads_dir, "kyc"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")
@app.get("/")
def root():
    return {"msg": "WorkSetu API running"}

@app.get("/socket.io/")
def socket_placeholder():
    return {"msg": "Socket.io not yet configured"}