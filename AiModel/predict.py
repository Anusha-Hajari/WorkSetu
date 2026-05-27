import joblib
import pandas as pd
import sys
import json

# Load model
model = joblib.load("model.pkl")

# STEP 1: Get input from Node (JSON string)
input_data = sys.stdin.read()
users = json.loads(input_data)

# STEP 2: Convert to DataFrame
df = pd.DataFrame(users)[["matchScore", "rating", "completedJobs", "responseTime"]]

# STEP 3: Predict
predictions = model.predict_proba(df)[:, 1]

# STEP 4: Attach scores
for i, user in enumerate(users):
    user["score"] = float(predictions[i])

# STEP 5: Sort users
sorted_users = sorted(users, key=lambda x: x["score"], reverse=True)

# STEP 6: Return result
print(json.dumps(sorted_users))