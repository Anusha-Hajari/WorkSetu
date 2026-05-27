from app.services.ai_service import rank_users

def get_best_users_for_job(job, users):
    filtered_users = []

    # get job skills (supports both single + multiple)
    job_skills = job.get("skills", [job.get("requiredSkill", "")])

    for user in users:
        user_skills = user.get("skills", [])

        # ⚡ STEP 1: filter only online users
        if not user.get("isOnline", False):
            continue

        # ⚡ STEP 2: skill matching
        common_skills = set(user_skills) & set(job_skills)

        if len(common_skills) > 0:

            # match score (0 to 1)
            if len(job_skills) > 0:
                match_score = len(common_skills) / len(job_skills)
            else:
                match_score = 0

            # ⚡ STEP 3: distance boost (closer = better)
            distance = user.get("distance", 10)  # default far
            distance_score = 1 / (1 + distance)

            # ⚡ STEP 4: Badge Boost (Motivation & Priority)
            badges = user.get("badges", [])
            badge_boost = min(len(badges) * 0.05, 0.2) # Max 20% boost for having many badges
            
            # ⚡ STEP 5: combine scores
            final_match = (0.6 * match_score + 0.3 * distance_score + 0.1 * (user.get("rating", 3)/5)) + badge_boost
            
            # Ensure score doesn't exceed 1.0 (unless we want priority to push it over)
            final_match = min(final_match, 1.0)

            filtered_users.append({
                "id": user["id"],
                "matchScore": final_match,
                "rating": user.get("rating", 3),
                "completedJobs": user.get("completedJobs", 0),
                "responseTime": user.get("responseTime", 5),
                "skills": user_skills,
                "distance": distance
            })

    # ⚠️ if no users matched
    if not filtered_users:
        return []

    # ⚡ STEP 5: AI ranking
    ranked_users = rank_users(filtered_users)

    # ⚡ STEP 6: return top 3
    return ranked_users[:3]