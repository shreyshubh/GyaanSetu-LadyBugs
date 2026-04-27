# GyaanSetu-LadyBugs

## TEAM CODE: UDB-Z3KF
## TEAM NAME: LADY BUGS
## PROBLEM STATEMENT - 01 
### *"Hyper Personalized Learning Assistant for Under-Served Students"*
Build an AI system that adapts to a student's learning style, pace, and knowledge gaps — offering contextual explanations, quizzes, and career guidance for low-resource college students.

**GyaanSetu** is an intelligent bridge that transforms static academic syllabi into dynamic, interactive learning journeys. By combining AI-driven tutoring with offline accessibility and personalized progress tracking, it directly solves the challenge of delivering high-quality, tailored education to underserved students.

---

## Key Features

- **Personalized Syllabus Parsing:** Upload PDF or DOCX files to automatically generate a structured syllabus tree using Groq AI.
- **Adaptive Quiz Engine:** Generates tailored quizzes based on confidence levels, pacing, and study history. Instantly grades MCQ and theoretical answers.
- **AI Tutor (RAG):** Context-aware explanation engine powered by HuggingFace Embeddings and MongoDB Atlas Vector Search. Includes Read Aloud functionality.
- **Offline Mode:** Seamless offline support with IndexedDB caching for quizzes and explanations, and automatic sync when back online.
- **Full Mobile Responsiveness:** Modern, adaptive UI that works perfectly on smartphones, tablets, and desktops.
- **Gamification & Tracking:** Strengths/Growth insights, performance categorization, streak tracking, and 14 unlockable achievement badges.
- **Career Guidance:** Role mapping based on strong/weak topics with curated YouTube video tutorials and scholarship recommendations.
- **Multilingual Support:** Full Hindi fallback for accessibility in diverse linguistic environments.

## Tech Stack

- **Frontend:** React + Vite, Vanilla CSS with Variables (Modern, premium design system)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas (M0 Free Tier)
- **Vector Store:** MongoDB Atlas Vector Search
- **AI / LLM:** Groq API (llama-3.3-70b-versatile)
- **Embeddings:** HuggingFace Inference API (BAAI/bge-m3)
- **Authentication:** JWT with bcrypt password hashing
- **Hosting:** Vercel (Frontend), Render (Backend)

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas Account
- Groq API Key
- HuggingFace API Key
- YouTube Data API v3 Key

## Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GyaanSetu-LadyBugs
```

### 2. Environment Variables Setup

**Backend (server/.env):**
Create a .env file in the server directory and add the following:
```env
PORT=5000
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-random-jwt-secret>
GROQ_API_KEY=<your-groq-api-key>
HF_API_KEY=<your-huggingface-api-key>
YOUTUBE_API_KEY=<your-youtube-data-api-v3-key>
```

**Frontend (client/.env):**
Create a .env file in the client directory and add the following:
```env
VITE_API_URL= http://localhost:5000
```

### 3. MongoDB Atlas Vector Search Setup (Crucial Step)

For the AI Explanation feature to work, you MUST create a Vector Search Index in your MongoDB Atlas UI manually.

1. Go to your MongoDB Atlas Dashboard.
2. Navigate to Atlas Search -> Create Index -> JSON Editor.
3. Select the embeddings collection.
4. Name the index exactly: vector_index.
5. Paste the following JSON configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "user_id"
    },
    {
      "type": "filter",
      "path": "syllabus_id"
    }
  ]
}
```
*(Note: Ensure syllabus_id is included as a filter path as per the latest multi-syllabus RAG scoping update).*

### 4. Install Dependencies & Run

**Start the Backend:**
```bash
cd server
npm install
npm start
```

**Start the Frontend:**
```bash
cd client
npm install
npm run dev
```
The app will be available at https://gyaan-setu-lady-bugs.vercel.app/ .

***GyaanSetu: Illuminating the path from potential to greatness, because true knowledge knows no boundaries.***
