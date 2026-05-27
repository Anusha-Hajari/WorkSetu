from pymongo import MongoClient

client = MongoClient("mongodb://Work_Setu_db_user:Work_Setu_AAA@ac-7all0jc-shard-00-00.wvqnx2w.mongodb.net:27017,ac-7all0jc-shard-00-01.wvqnx2w.mongodb.net:27017,ac-7all0jc-shard-00-02.wvqnx2w.mongodb.net:27017/work_setu_db?authSource=admin&replicaSet=atlas-ioftfv-shard-0&tls=true")
db = client["work_setu_db"]

# UNIQUE EMAIL INDEX
try:
    db.users.create_index("email", unique=True)
except Exception as e:
    print(f"Error creating unique index: {e}")