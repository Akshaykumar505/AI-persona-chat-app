# AI Persona Chat App

An AI-powered chat application that simulates conversations with two popular Indian coding educators — **Hitesh Choudhary** and **Piyush Garg** — by replicating their communication style, teaching approach, and personality through carefully engineered LLM prompts.

🔗 **Live Demo:** https://ai-persona-chat-app.vercel.app/
🔗 **Backend API:** https://ai-persona-chat-app.onrender.com

> ⚠️ **Disclaimer:** This is an AI simulation inspired by publicly available content. It is not affiliated with, endorsed by, or operated by Hitesh Choudhary or Piyush Garg. All responses are AI-generated.

---

## Features

- 🤖 Two distinct AI personas with unique speaking styles and teaching philosophies
- 🔐 User authentication (Firebase Email/Password)
- 🎤 Voice input (Speech-to-Text)
- 🔊 Voice output (Text-to-Speech)
- 🌗 Dark / Light mode toggle
- 📋 Copy AI responses to clipboard
- 🗑️ Clear chat history
- 🛡️ Rate limiting to prevent API abuse
- 🚀 Fully deployed (frontend + backend)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express.js |
| AI/LLM | OpenRouter API (LLM inference) |
| Authentication | Firebase Authentication |
| Voice | Web Speech API (browser-native) |
| Hosting | Vercel (frontend), Render (backend) |
| Version Control | Git + GitHub |

---

## Project Structure
persona-chat-app/
├── backend/
│   ├── index.js              # Express server, API routes, auth middleware
│   ├── personas.js           # Persona definitions & system prompts
│   ├── firebase-service-account.json   # (gitignored) Firebase Admin credentials
│   └── .env                  # (gitignored) API keys and secrets
│
└── frontend/
├── src/
│   ├── App.jsx            # Main application component
│   ├── Auth.jsx           # Login/Signup screen
│   ├── firebase.js        # Firebase client config
│   └── index.css          # Tailwind directives
└── .env                   # (gitignored) Firebase client config, admin key

---

## Local Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm
- A free [OpenRouter](https://openrouter.ai) account and API key
- A free [Firebase](https://console.firebase.google.com) project with Authentication (Email/Password) enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Akshaykumar505/AI-persona-chat-app.git
cd AI-persona-chat-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
ADMIN_SECRET_KEY=your_custom_admin_secret

Download your Firebase service account JSON (Firebase Console → Project Settings → Service Accounts → Generate new private key), rename it to `firebase-service-account.json`, and place it inside `backend/`.

Start the backend:

```bash
npm run dev
```

Server runs at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` folder: 
VITE_ADMIN_KEY=your_custom_admin_secret

In `src/firebase.js`, add your Firebase web app config (from Firebase Console → Project Settings → General → Your apps).

Start the frontend:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### 4. Usage

1. Open the app in your browser.
2. Sign up with an email and password.
3. Select a persona (Hitesh Choudhary or Piyush Garg).
4. Start chatting — text or voice input supported.

---

## Environment Variables Summary

| Variable | Location | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | backend/.env | Access to LLM via OpenRouter |
| `PORT` | backend/.env | Backend server port |
| `ADMIN_SECRET_KEY` | backend/.env | Bypass login for admin/testing |
| `FIREBASE_SERVICE_ACCOUNT` | backend (deployment env var) | Firebase Admin SDK credentials (JSON string, used in production instead of the local JSON file) |
| `VITE_ADMIN_KEY` | frontend/.env | Matches backend admin key for admin URL access |

---

## Security Measures

- API keys are stored server-side only (`.env`), never exposed to the client.
- All chat requests require a valid Firebase authentication token.
- Rate limiting (10 requests/minute per IP) on the chat endpoint.
- `.env` and Firebase service account files are excluded via `.gitignore`.

---

## Additional Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for details on:
- How persona data was collected and prepared
- Prompt engineering strategy
- Context management approach
- Sample conversations demonstrating both personas
