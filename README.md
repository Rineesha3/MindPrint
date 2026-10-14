<<<<<<< HEAD
# MindPrint - Personality Type Prediction

Predicts your MBTI-style personality type from how you write, combined with a short adaptive quiz.

## Project Overview

Users write a short piece about themselves. Four machine-learning models (one per personality axis) read the writing and estimate where the user leans, then the app plans a quiz that asks more questions on the axes the model is unsure about. The final type blends the quiz answers with the model's reading. A Python/FastAPI service runs the models and handles user accounts and history, while a Next.js frontend provides the web pages.

## Key Features

- Three test modes: Quick Quiz (10 questions), Deep Quiz (40 questions) and Free Writing
- Adaptive questions based on what the model is unsure about
- Result breakdown for each axis (I/E, N/S, T/F, J/P) with confidence levels and writing-style notes
- Profiles for all 16 types and a compatibility checker for any two types
- User sign-up and login
- Password reset by email
- Prediction history saved for each user
- Dark and light themes

## Technology Stack

- Frontend: Next.js 14, React, TypeScript, TailwindCSS
- Backend: Python, FastAPI, SQLAlchemy, MySQL
- Machine Learning: CatBoost, scikit-learn (TF-IDF), trained on the Kaggle MBTI dataset

## Installation and Setup

### Prerequisites

- Python 3.12 or higher
- Node.js and npm
- MySQL database

### Backend

```
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=mbti
BACKEND_URL=http://localhost:8001
FRONTEND_URL=http://localhost:3000
```

Create the `mbti` database in MySQL (the tables are created automatically), then start the server:

```
uvicorn app.main:app --reload --port 8001
```

The API runs on http://localhost:8001.

### Frontend

Create a `.env` file in the `frontend` folder:

```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

```
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:3000. Keep the backend running alongside it.
=======
# MindPrint
>>>>>>> 7e9db397a357e672012f0c4daf32ed29ccb6994a
