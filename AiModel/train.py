import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib

# STEP 1: Load dataset
data = pd.read_csv("dataset.csv")

# STEP 2: Features (X) and Target (y)
X = data[["matchScore", "rating", "completedJobs", "responseTime"]]
y = data["success"]

# STEP 3: Split into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# STEP 4: Create model
model = LogisticRegression()

# STEP 5: Train model
model.fit(X_train, y_train)

# STEP 6: Predictions
y_pred = model.predict(X_test)

# STEP 7: Evaluate accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.2f}")

# STEP 8: Save model
joblib.dump(model, "model.pkl")

print("Model trained and saved as model.pkl")