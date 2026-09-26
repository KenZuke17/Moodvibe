from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import pymongo
from pymongo import MongoClient
import bcrypt
import base64
import io
import cv2
import numpy as np
from PIL import Image
from deepface import DeepFace
import datetime
import os
from dotenv import load_dotenv
import json
import requests
from flask_cors import CORS
from mongodb_setup import setup_mongodb

load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# MongoDB connection using mongodb_setup
client, db, users_collection, emotions_collection, media_collection, mood_journal_collection = setup_mongodb()

if client is None:
    print("Failed to initialize MongoDB. Application may not function correctly.")

# Hardcoded media data for recommendations
RECOMMENDATIONS = {
    "happy": [
        {
            "emotion": "happy",
            "type": "song",
            "title": "Levitating",
            "description": "Dua Lipa, DaBaby",
            "url": "/static/audio/dua_lipa_levitating.mp3",
            "image": "https://i.ytimg.com/vi/d28NLh9IT14/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA7wfyWm7AQTCcuAlQZsMAcP8DGSg"
        },
        {
            "emotion": "happy",
            "type": "song",
            "title": "Believer",
            "description": "Imagine Dragons",
            "url": "/static/audio/believer.mp3",
            "image": "https://i.ytimg.com/vi/W0DM5lcj6mw/maxresdefault.jpg"
        },
        {
            "emotion": "happy",
            "type": "book",
            "title": "Happy gut happy mind",
            "description": "An inspiring tale of following your dreams",
            "image": "https://evekalinik.com/wp-content/uploads/2024/03/hghm-book.jpg",
            "author": "Paulo Coelho"
        },
        {
            "emotion": "happy",
            "type": "book",
            "title": "The Happiness Project",
            "description": "A memoir and self-help book chronicling a journey to increase happiness",
            "image": "https://www.cloudninesoap.com/cdn/shop/articles/the_happiness_project_book_by_gretchen_rubin.jpg?v=1452529310",
            "author": "Gretchen Rubin"
        },
        {
            "emotion": "happy",
            "type": "movie",
            "title": "The Greatest Showman",
            "description": "A vibrant musical about P.T. Barnum's creation of the circus",
            "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpmwvIDlC0kehUR6eWN6C2c0OSYZkf2QeAgw&s"
        }
    ],
    "sad": [
        {
            "emotion": "sad",
            "type": "song",
            "title": "Hurts So Good",
            "description": "Astrid S",
            "url": "/static/audio/hurts_so_good.mp3",
            "image": "https://i.ytimg.com/vi/O-E9XCSdALY/maxresdefault.jpg"
        },
        {
            "emotion": "sad",
            "type": "song",
            "title": "Love Me Like You Do",
            "description": "Ellie Goulding",
            "url": "/static/audio/love_me_like_you_do.mp3",
            "image": "https://i.ytimg.com/vi/uWoYIOcOpwU/sddefault.jpg"
        },
        {
            "emotion": "sad",
            "type": "book",
            "title": "A Man Called Ove",
            "description": "A poignant story of a widower finding new meaning in life",
            "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLcxMCNzyxnWq6HbD3gfpefVjzveSnBS_d7A&s",
            "author": "Fredrik Backman"
        },
        {
            "emotion": "sad",
            "type": "movie",
            "title": "The Fault in Our Stars",
            "description": "A touching story of two young cancer patients falling in love",
            "image": "https://disney.images.edge.bamgrid.com/ripcut-delivery/v2/variant/disney/65e28772-1a50-4cae-9c58-9822b1fd06cc/compose?aspectRatio=1.78&format=webp&width=1200"
        }
    ],
    "angry": [
        {
            "emotion": "angry",
            "type": "song",
            "title": "What I've Done",
            "description": "Linkin Park",
            "url": "/static/audio/what_ive_done.mp3",
            "image": "https://i.ytimg.com/vi/SAmalp-W8I8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCg36MY8CJexphH5EhI4dBmPCR30Q"
        },
        {
            "emotion": "angry",
            "type": "book",
            "title": "1984",
            "description": "A powerful dystopian novel",
            "image": "https://www.thegreatbritishbookshop.co.uk/cdn/shop/products/9786257120890_1100x.jpg?v=1656321253",
            "author": "George Orwell"
        },
        {
            "emotion": "angry",
            "type": "book",
            "title": "The Catcher in the Rye",
            "description": "A novel about teenage angst and alienation",
            "image": "https://cdn.britannica.com/94/181394-050-2F76F7EE/Reproduction-cover-edition-The-Catcher-in-the.jpg?w=400&h=300&c=crop",
            "author": "J.D. Salinger"
        },
        {
            "emotion": "angry",
            "type": "movie",
            "title": "Fight Club",
            "description": "A provocative film about rebellion against societal norms",
            "image": "https://media.newyorker.com/photos/5dbafcc91b4a6700085a7a9b/16:9/w_2559,h_1439,c_limit/Baker-FightClub.jpg"
        }
    ],
    "neutral": [
        {
            "emotion": "neutral",
            "type": "song",
            "title": "Don't Let Me Down",
            "description": "The Chainsmokers",
            "url": "/static/audio/dont_let_me_down.mp3",
            "image": "https://i.ytimg.com/vi/mywyuiAbww4/maxresdefault.jpg"
        },
        {
            "emotion": "neutral",
            "type": "song",
            "title": "Thunder",
            "description": "Imagine Dragons",
            "url": "/static/audio/thunder.mp3",
            "image": "https://i.ytimg.com/vi/GtEvysh1654/sddefault.jpg"
        },
        {
            "emotion": "neutral",
            "type": "book",
            "title": "Sapiens",
            "description": "A fascinating look at human history",
            "image": "https://m.media-amazon.com/images/I/51XyWW6zEXL._SL500_.jpg",
            "author": "Yuval Noah Harari"
        },
        {
            "emotion": "neutral",
            "type": "book",
            "title": "The Little Prince",
            "description": "A poetic novella about a young prince’s journey",
            "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoR0hYy6AT51jLP6iFkOy0YS1hPywM-1qnUw&s",
            "author": "Antoine de Saint-Exupéry"
        },
        {
            "emotion": "neutral",
            "type": "movie",
            "title": "Amélie",
            "description": "A whimsical tale of a young woman changing lives in Paris",
            "image": "https://chicagoplays.com/wp-content/uploads/2025/04/Amelie_Kokandy.jpg"
        }
    ]
}

def analyze_emotion(image_data):
    """Analyze emotion from base64 image data"""
    try:
        # Decode base64 image
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Save temporary image
        temp_path = 'temp_emotion.jpg'
        cv2.imwrite(temp_path, img_bgr)
        
        # Analyze emotion using DeepFace
        result = DeepFace.analyze(temp_path, actions=['emotion'], enforce_detection=False)
        
        # Clean up temporary file
        os.remove(temp_path)
        
        # Extract dominant emotion
        if isinstance(result, list):
            emotions = result[0]['emotion']
        else:
            emotions = result['emotion']
            
        dominant_emotion = max(emotions, key=emotions.get)
        confidence = emotions[dominant_emotion]
        
        return {
            'emotion': dominant_emotion,
            'confidence': confidence,
            'all_emotions': emotions
        }
        
    except Exception as e:
        print(f"Emotion analysis error: {e}")
        return {
            'emotion': 'neutral',
            'confidence': 0.5,
            'all_emotions': {'neutral': 0.5}
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/home')
def home():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('home.html')

@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Check if user already exists
        if users_collection.find_one({'email': email}):
            return jsonify({'success': False, 'message': 'Email already exists'})
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert user
        user_doc = {
            'username': username,
            'email': email,
            'password': hashed_password,
            'created_at': datetime.datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_doc)
        
        return jsonify({'success': True, 'message': 'Registration successful'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        # Find user
        user = users_collection.find_one({'email': email})
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            session['user_id'] = str(user['_id'])
            session['username'] = user['username']
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logout successful'})

@app.route('/api/capture_emotion', methods=['POST'])
def capture_emotion():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'})
        
        data = request.get_json()
        image_data = data.get('image')
        
        # Analyze emotion
        emotion_result = analyze_emotion(image_data)
        
        # Store in database
        emotion_doc = {
            'user_id': session['user_id'],
            'emotion': emotion_result['emotion'],
            'confidence': emotion_result['confidence'],
            'timestamp': datetime.datetime.utcnow()
        }
        
        emotions_collection.insert_one(emotion_doc)
        
        return jsonify({
            'success': True,
            'emotion': emotion_result['emotion'],
            'confidence': emotion_result['confidence'],
            'all_emotions': emotion_result['all_emotions']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/recommendations/<emotion>')
def get_recommendations(emotion):
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'})
        
        # Return hardcoded recommendations for the given emotion
        recommendations = RECOMMENDATIONS.get(emotion, [])
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/history')
def get_history():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'})
        
        # Get user's emotion history
        history = list(emotions_collection.find({'user_id': session['user_id']}).sort('timestamp', -1).limit(50))
        
        # Convert ObjectId to string and format dates
        for record in history:
            record['_id'] = str(record['_id'])
            record['timestamp'] = record['timestamp'].isoformat()
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/mood_journal', methods=['POST'])
def add_mood_journal():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'})
        
        data = request.get_json()
        
        journal_entry = {
            'user_id': session['user_id'],
            'emotion': data.get('emotion'),
            'note': data.get('note'),
            'timestamp': datetime.datetime.utcnow()
        }
        
        mood_journal_collection.insert_one(journal_entry)
        
        return jsonify({'success': True, 'message': 'Journal entry added'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/mood_journal')
def get_mood_journal():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'})
        
        # Get user's mood journal entries
        entries = list(mood_journal_collection.find({'user_id': session['user_id']}).sort('timestamp', -1))
        
        # Convert ObjectId to string and format dates
        for entry in entries:
            entry['_id'] = str(entry['_id'])
            entry['timestamp'] = entry['timestamp'].isoformat()
        
        return jsonify({
            'success': True,
            'entries': entries
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/generate_playlist')
def generate_playlist():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Not authenticated'})
        
        # Get user's recent emotions
        recent_emotions = list(emotions_collection.find({'user_id': session['user_id']}).sort('timestamp', -1).limit(10))
        
        # Get songs based on emotions
        playlist_songs = []
        for emotion_record in recent_emotions:
            # Filter for songs only
            songs = [item for item in RECOMMENDATIONS.get(emotion_record['emotion'], []) if item['type'] == 'song']
            playlist_songs.extend(songs)
        
        # Generate M3U playlist content with absolute URLs
        playlist_content = "#EXTM3U\n"
        for song in playlist_songs:
            playlist_content += f"#EXTINF:-1,{song['title']}\n"
            playlist_content += f"http://localhost:5000{song.get('url', '')}\n"
        
        return jsonify({
            'success': True,
            'playlist': playlist_content,
            'songs': playlist_songs
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)