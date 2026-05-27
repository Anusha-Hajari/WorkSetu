from app.db.database import db
from datetime import datetime

def record_transaction(user_id: str, type: str, amount: float, description: str, reference_id: str = None):
    """
    Records a wallet transaction for a user.
    Types: 'deposit', 'withdrawal', 'payment_sent', 'payment_received', 'escrow_lock', 'escrow_refund', 'escrow_release'
    """
    transaction = {
        "user_id": user_id,
        "type": type,
        "amount": amount,
        "description": description,
        "reference_id": reference_id,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    db.transactions.insert_one(transaction)
