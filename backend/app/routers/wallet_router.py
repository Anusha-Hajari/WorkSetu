from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from app.db.database import db
from app.services.auth_service import verify_token

router = APIRouter()

class DepositRequest(BaseModel):
    amount: float

@router.get("/")
def get_wallet(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "balance": db_user.get("wallet_balance", 0.0),
        "escrow_balance": db_user.get("escrow_balance", 0.0)
    }

@router.post("/deposit")
def deposit_funds(body: DepositRequest, user=Depends(verify_token)):
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
        
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Simulate adding funds to the wallet
    db.users.update_one(
        {"_id": db_user["_id"]},
        {"$inc": {"wallet_balance": body.amount}}
    )

    from app.services.transaction_service import record_transaction
    record_transaction(str(db_user["_id"]), "deposit", body.amount, "Funds added to wallet via Simulated Payment")
    
    return {"msg": "Funds deposited successfully", "new_balance": db_user.get("wallet_balance", 0.0) + body.amount}

@router.get("/history")
def get_transaction_history(user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    user_id = str(db_user["_id"])
    
    transactions = list(db.transactions.find({"user_id": user_id}).sort("timestamp", -1))
    for t in transactions:
        t["_id"] = str(t["_id"])
    return transactions

@router.post("/withdraw")
def withdraw_funds(body: DepositRequest, user=Depends(verify_token)):
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if body.amount > db_user.get("wallet_balance", 0.0):
        raise HTTPException(status_code=400, detail="Insufficient funds")
        
    db.users.update_one(
        {"_id": db_user["_id"]},
        {"$inc": {"wallet_balance": -body.amount}}
    )
    
    from app.services.transaction_service import record_transaction
    record_transaction(str(db_user["_id"]), "withdrawal", -body.amount, "Withdrawal to Bank Account (Simulated)")
    
    return {"msg": "Withdrawal request processed"}
    
@router.post("/test-credit")
def add_test_credit(user=Depends(verify_token)):
    """Add ₹5000 test balance to the user wallet for development testing."""
    db_user = db.users.find_one({"email": user["email"]})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.users.update_one(
        {"_id": db_user["_id"]},
        {"$inc": {"wallet_balance": 5000.0}}
    )
    
    from app.services.transaction_service import record_transaction
    record_transaction(str(db_user["_id"]), "test_credit", 5000.0, "Free Test Credit (₹5000) added for development")
    
    return {"msg": "₹5000 Test Credit added successfully!", "new_balance": db_user.get("wallet_balance", 0.0) + 5000.0}

