# ✈️ TripPilot AI

TripPilot AI is an AI-powered travel and flight assistant that helps users
search flights, get travel information, and simulate flight bookings using
AI agents.

## 🚀 Features

- ✈️ Flight search using Duffel API
- 🤖 AI Agent using LangChain
- 🔧 AI Tool Calling
- 📚 RAG for travel information
- 🧠 Embeddings and Vector Store
- 💬 AI Travel Assistant
- 🎫 Demo Flight Booking
- 🔐 User Authentication
- 🗄️ PostgreSQL Database

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript

### Backend
- NestJS
- PostgreSQL
- TypeORM
- JWT

### AI
- Python
- LangChain
- LLM
- FastAPI
- RAG
- Embeddings
- Vector Store

### External API
- Duffel API

## 🏗️ Architecture

```text
User
 ↓
Next.js
 ↓
NestJS Backend
 ↓
Python AI Service
 ↓
LangChain Agent
 ├── Flight Tools → Duffel
 └── RAG → Vector Store
 ↓
PostgreSQL
