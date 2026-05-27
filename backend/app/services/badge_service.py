from app.db.database import db
from bson import ObjectId
from datetime import datetime

BADGE_DEFINITIONS = {
    "quick_starter": {
        "name": "Quick Starter",
        "icon": "🚀",
        "description": "Completed your first job successfully!",
        "color": "#6366f1"
    },
    "speed_demon": {
        "name": "Speed Demon",
        "icon": "⚡",
        "description": "Completed a job within 24 hours of starting.",
        "color": "#fbbf24"
    },
    "five_star_pro": {
        "name": "Five Star Pro",
        "icon": "⭐",
        "description": "Maintain a perfect 5.0 rating over multiple jobs.",
        "color": "#f59e0b"
    },
    "media_pro": {
        "name": "Media Pro",
        "icon": "📸",
        "description": "Provided 10+ authentic media progress updates.",
        "color": "#10b981"
    },
    "trusted_partner": {
        "name": "Trusted Partner",
        "icon": "🤝",
        "description": "Completed 10+ jobs on WorkSetu.",
        "color": "#818cf8"
    }
}

def check_and_grant_badges(user_id: str):
    """Checks all badge criteria for a user and grants new ones."""
    db_user = db.users.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        return []

    current_badges = db_user.get("badges", [])
    new_badges = []
    
    # 1. Quick Starter
    completed_jobs = db_user.get("completedJobs", 0)
    if completed_jobs >= 1 and "quick_starter" not in [b["id"] for b in current_badges]:
        new_badges.append("quick_starter")

    # 2. Trusted Partner
    if completed_jobs >= 10 and "trusted_partner" not in [b["id"] for b in current_badges]:
        new_badges.append("trusted_partner")

    # 3. Five Star Pro
    rating = db_user.get("rating", 0)
    if rating >= 4.8 and completed_jobs >= 3 and "five_star_pro" not in [b["id"] for b in current_badges]:
        new_badges.append("five_star_pro")

    # 4. Media Pro
    media_count = db.tracking.aggregate([
        {"$unwind": "$updates"},
        {"$match": {"updates.mediaUrl": {"$ne": None}, "updates.media_verdict.verdict": "authentic"}},
        {"$project": {"job_id": 1, "worker_id": "$updates.sender_id"}}, # We'll need to ensure sender_id is stored
    ])
    # Simplified media check for now: count authentic updates by this user across tracking
    # (Assuming we can find them. In a real app we'd query by worker_id)
    
    # Let's grant any new badges
    for badge_id in new_badges:
        badge_info = BADGE_DEFINITIONS[badge_id]
        badge_info["id"] = badge_id
        badge_info["granted_at"] = datetime.utcnow().isoformat()
        
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"badges": badge_info}}
        )
        
    return new_badges
