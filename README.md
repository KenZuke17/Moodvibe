# MoodVibe

MoodVibe is a Flask web application that uses facial emotion recognition to suggest personalized songs, books, and movies. It also includes user registration, login, MongoDB storage, mood journaling, and email-based password reset.

## Features

- User registration and secure bcrypt password hashing
- Login and session-based authentication
- Facial emotion detection with DeepFace and TensorFlow
- Personalized media recommendations
- Emotion and mood journal storage in MongoDB Atlas
- Forgot-password flow with expiring email reset links
- Light and dark theme support

## Requirements

- Python 3.11
- MongoDB Atlas account and cluster
- Gmail account with a Google App Password for password-reset emails

Python 3.11 is recommended because the project uses TensorFlow 2.13.

## Installation

Clone the repository and enter the project directory:

```powershell
git clone https://github.com/KenZuke17/Moodvibe.git
cd Moodvibe
```

Create and activate a virtual environment:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the project root. Never commit this file because it contains credentials.

```env
SECRET_KEY=replace-with-a-long-random-secret
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=emotion_recognition

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your Gmail address
SMTP_PASSWORD=your Google App Password
SMTP_FROM=your Gmail address

HOST=127.0.0.1
PORT=5000
FLASK_DEBUG=true
```

In MongoDB Atlas, create a database user and allow your IP address under **Database & Network Access**. For Gmail, enable 2-Step Verification and create an App Password. Use the App Password instead of your normal Gmail password.

## Run

From the project directory:

```powershell
.\.venv\Scripts\python.exe app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser.

Password recovery is available at [http://127.0.0.1:5000/forgot-password](http://127.0.0.1:5000/forgot-password).

## Security

- `.env` is excluded from Git using `.gitignore`.
- Never publish MongoDB credentials, Gmail App Passwords, or Flask secret keys.
- Use URL-safe credentials or properly URL-encode special characters in MongoDB connection strings.
- Reset links expire after 30 minutes and can only be used once.

## Project Structure

```text
Moodvibe/
├── app.py
├── mongodb_setup.py
├── requirements.txt
├── static/
├── templates/
├── .env                # Local secrets; not committed
└── .gitignore
```