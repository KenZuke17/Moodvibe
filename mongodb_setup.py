"""
MongoDB Setup Script for MoodVibe Application
This script initializes the MongoDB database with collections and indexes
"""

import pymongo
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def setup_mongodb():
    """Initialize MongoDB with collections and indexes"""
    
    # Connect to MongoDB Atlas
    try:
        client = MongoClient(
            os.environ['MONGODB_URI'],
            serverSelectionTimeoutMS=5000,
        )
        client.admin.command('ping')
        db = client[os.environ.get('MONGODB_DB_NAME', 'emotion_recognition')]
        print("Connected to MongoDB Atlas successfully!")
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return None, None, None, None, None, None
    
    # Create collections
    users_collection = db['users']
    emotions_collection = db['emotions']
    media_collection = db['media']
    mood_journal_collection = db['mood_journal']
    
    # Create indexes for better performance
    users_collection.create_index("email", unique=True)
    emotions_collection.create_index("user_id")
    emotions_collection.create_index("timestamp")
    mood_journal_collection.create_index("user_id")
    mood_journal_collection.create_index("timestamp")
    
    print("Created database indexes")
    
    print("\nMongoDB setup completed successfully!")
    print(f"Database: {db.name}")
    print(f"Collections: {db.list_collection_names()}")
    
    # Display statistics
    print(f"\nStatistics:")
    print(f"Users: {users_collection.count_documents({})}")
    print(f"Media items: {media_collection.count_documents({})}")
    print(f"Emotions: {emotions_collection.count_documents({})}")
    print(f"Journal entries: {mood_journal_collection.count_documents({})}")
    
    return client, db, users_collection, emotions_collection, media_collection, mood_journal_collection

if __name__ == "__main__":
    setup_mongodb()