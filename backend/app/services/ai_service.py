import joblib
import pandas as pd
import os
from datetime import datetime, timedelta

# Build path relative to this file → ../../AiModel/model.pkl
_BASE = os.path.dirname(os.path.abspath(__file__))
_MODEL_PATH = os.path.join(_BASE, "..", "..", "..", "AiModel", "model.pkl")
_MODEL_PATH = os.path.normpath(_MODEL_PATH)

try:
    model = joblib.load(_MODEL_PATH)
    _model_loaded = True
except Exception as e:
    print(f"[AI] Warning: Could not load model from {_MODEL_PATH}: {e}")
    _model_loaded = False


def rank_users(users: list) -> list:
    """Rank users by AI model score. Falls back to matchScore if model unavailable."""
    if not users:
        return []

    if not _model_loaded:
        # Fallback: sort by matchScore manually
        return sorted(users, key=lambda u: u.get("matchScore", 0), reverse=True)

    try:
        df = pd.DataFrame(users)[["matchScore", "rating", "completedJobs", "responseTime"]]
        predictions = model.predict_proba(df)[:, 1]
        for i, user in enumerate(users):
            user["score"] = float(predictions[i])
        return sorted(users, key=lambda x: x["score"], reverse=True)
    except Exception as e:
        print(f"[AI] Prediction error: {e}")
        return sorted(users, key=lambda u: u.get("matchScore", 0), reverse=True)

def evaluate_interview(answers: list, job_desc: str):
    """Simulated AI interview evaluation."""
    score = 70 # Base score
    feedback = []
    
    if not answers:
        return {"score": 0, "feedback": "No answers provided."}

    total_words = sum(len(a.get("answer", "").split()) for a in answers)
    
    if total_words < 10:
        score -= 30
        feedback.append("Answers were extremely brief.")
    elif total_words > 60:
        score += 15
        feedback.append("Detailed and thorough responses.")
        
    # Keyword check (simulated)
    keywords = job_desc.lower().split()
    matched = 0
    all_answers_text = " ".join(a.get("answer", "").lower() for a in answers)
    for kw in keywords:
        if len(kw) > 4 and kw in all_answers_text:
            matched += 1
                
    if matched > 3:
        score += 15
        feedback.append("Strong alignment with job requirements.")
    
    return {
        "score": min(score, 100),
        "feedback": " | ".join(feedback) if feedback else "Standard response."
    }

def evaluate_work_update(text: str, job_desc: str) -> dict:
    """
    Simulated AI evaluation of a work progress update.
    In a fully featured environment, this would call an LLM to assess if the update
    aligns with the job_desc.
    """
    text_lower = text.lower()
    
    # Simple simulated checks
    if len(text.strip()) < 10:
        return {
            "passed": False, 
            "score": 30, 
            "feedback": "Your update is too brief. Please provide more descriptive details about what work was done so it can be approved."
        }
        
    # Check for progress keywords
    progress_keywords = ["done", "completed", "finished", "progress", "started", "fixed", "built", "painted", "cleaned"]
    if any(word in text_lower for word in progress_keywords):
        return {
            "passed": True, 
            "score": 85, 
            "feedback": "AI Verification Passed: The update aligns well with progress markers. Waiting for poster approval."
        }
        
    return {
        "passed": True, 
        "score": 60, 
        "feedback": "AI Verification Passed: General update logged. Waiting for poster approval."
    }


def verify_media_authenticity(file_path: str, original_filename: str) -> dict:
    """
    STRICT AI Media Authenticity Verification.
    Only real-time camera photos pass. Screenshots, AI-generated images,
    old/downloaded images are flagged and rejected.
    """
    from PIL import Image
    from PIL.ExifTags import TAGS
    
    flags = []
    confidence = 100
    has_exif = False
    exif_time = None
    has_camera_info = False
    has_gps = False
    
    try:
        img = Image.open(file_path)
    except Exception:
        return {
            "verdict": "flagged",
            "confidence": 0,
            "reason": "File could not be opened as a valid image.",
            "checks": {"valid_image": False}
        }
    
    width, height = img.size
    
    # ── Check 1: EXIF Metadata (STRICT — required for authentic) ────
    exif_data = {}
    try:
        raw_exif = img._getexif()
        if raw_exif:
            has_exif = True
            for tag_id, value in raw_exif.items():
                tag_name = TAGS.get(tag_id, tag_id)
                exif_data[tag_name] = value
    except Exception:
        pass
    
    if not has_exif:
        flags.append("REJECTED: No EXIF metadata. Real camera photos always have EXIF. This looks like a screenshot, downloaded image, or AI-generated image.")
        confidence -= 40
    
    # ── Check 2: Camera / Device Info ───────────────────────────────
    camera_make = exif_data.get("Make", "")
    camera_model = exif_data.get("Model", "")
    software = str(exif_data.get("Software", ""))
    
    if camera_make or camera_model:
        has_camera_info = True
    else:
        if has_exif:
            flags.append("WARNING: No camera device info. May be processed or edited.")
            confidence -= 15
        else:
            confidence -= 10
    
    # Check for AI generation software signatures
    ai_hints = ["dall-e", "midjourney", "stable diffusion", "comfyui", "automatic1111", "novelai", "adobe firefly", "canva"]
    if software and any(h in software.lower() for h in ai_hints):
        flags.append(f"REJECTED: AI generation tool detected in metadata: '{software}'.")
        confidence -= 60
    
    # Check for image editors (indicates downloaded + edited)
    editor_hints = ["photoshop", "gimp", "paint", "snipping"]
    if software and any(h in software.lower() for h in editor_hints):
        flags.append(f"WARNING: Image editor detected: '{software}'. This may not be a direct camera capture.")
        confidence -= 15
    
    # ── Check 3: Timestamp Freshness (STRICT) ──────────────────────
    date_taken_str = exif_data.get("DateTimeOriginal") or exif_data.get("DateTime")
    if date_taken_str:
        try:
            date_taken = datetime.strptime(str(date_taken_str), "%Y:%m:%d %H:%M:%S")
            exif_time = date_taken
            time_diff = datetime.utcnow() - date_taken
            
            if time_diff > timedelta(days=1):
                flags.append(f"REJECTED: Image is {time_diff.days} day(s) old. Must be taken in real-time during the current work session.")
                confidence -= 35
            elif time_diff > timedelta(hours=4):
                flags.append(f"WARNING: Image was taken {int(time_diff.total_seconds()//3600)} hours ago. Should be from current session.")
                confidence -= 20
            elif time_diff > timedelta(hours=1):
                flags.append("NOTICE: Image taken more than 1 hour ago.")
                confidence -= 5
        except Exception:
            pass
    else:
        if has_exif:
            flags.append("WARNING: No timestamp in EXIF. Cannot verify when image was taken.")
            confidence -= 15
    
    # ── Check 4: GPS Location ─────────────────────────────────────
    gps_info = exif_data.get("GPSInfo")
    if gps_info:
        has_gps = True
    
    # ── Check 5: AI-Generated Image Detection (Resolution) ────────
    ai_resolutions = [
        (512, 512), (768, 768), (1024, 1024), (1024, 1792), (1792, 1024),
        (256, 256), (512, 768), (768, 512), (1024, 768), (768, 1024),
        (2048, 2048), (1536, 1536)
    ]
    if (width, height) in ai_resolutions:
        flags.append(f"WARNING: Resolution ({width}x{height}) matches common AI generation output sizes.")
        confidence -= 15
    
    # Perfect square with no EXIF = very likely AI
    if width == height and not has_exif and width >= 256:
        flags.append("REJECTED: Square image with no metadata is a strong AI-generation indicator.")
        confidence -= 25
    
    # ── Check 6: Image Statistical Analysis ───────────────────────
    try:
        rgb_img = img.convert("RGB")
        pixels = list(rgb_img.getdata())
        total_pixels = width * height
        
        if total_pixels > 0:
            sample_size = min(2000, total_pixels)
            step = max(1, total_pixels // sample_size)
            sampled = pixels[::step]
            
            r_vals = [p[0] for p in sampled]
            g_vals = [p[1] for p in sampled]
            b_vals = [p[2] for p in sampled]
            
            def variance(vals):
                mean = sum(vals) / len(vals)
                return sum((x - mean) ** 2 for x in vals) / len(vals)
            
            r_var = variance(r_vals)
            g_var = variance(g_vals)
            b_var = variance(b_vals)
            avg_var = (r_var + g_var + b_var) / 3
            
            if avg_var < 50:
                flags.append("REJECTED: Image has very low color variance — blank or placeholder image.")
                confidence -= 30
                
            # Check for unnaturally uniform noise (AI images often have very smooth gradients)
            # Real photos have more noise/grain
            unique_colors = len(set(sampled))
            color_diversity = unique_colors / len(sampled)
            
            if color_diversity < 0.05 and not has_exif:
                flags.append("WARNING: Very low color diversity. Possible solid/generated image.")
                confidence -= 10
    except Exception:
        pass
    
    # ── Check 7: File extension vs content check ──────────────────
    original_ext = original_filename.lower().split(".")[-1] if "." in original_filename else ""
    screenshot_indicators = ["screenshot", "screen", "snip", "capture", "clipboard"]
    if any(ind in original_filename.lower() for ind in screenshot_indicators):
        flags.append("REJECTED: Filename indicates this is a screenshot, not a real-time photo.")
        confidence -= 30
    
    # ── Final Verdict (STRICT thresholds) ─────────────────────────
    confidence = max(0, min(100, confidence))
    
    if confidence >= 75:
        verdict = "authentic"
    elif confidence >= 45:
        verdict = "suspicious"
    else:
        verdict = "flagged"
    
    reason_summary = " | ".join(flags) if flags else "All checks passed. Image appears to be a real-time camera photo."
    
    return {
        "verdict": verdict,
        "confidence": confidence,
        "reason": reason_summary,
        "checks": {
            "has_exif": has_exif,
            "has_camera_info": has_camera_info,
            "has_gps": has_gps,
            "exif_timestamp": str(exif_time) if exif_time else None,
            "resolution": f"{width}x{height}",
            "flags_count": len(flags)
        }
    }