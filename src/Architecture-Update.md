# 🏗️ Architecture Update: Unified Search & Python AI Integration

**Date:** December 17, 2025
**Project:** MoodScout (FullStack)

## 📋 Overview
This update transitions the application from a frontend-heavy logic to a centralized backend architecture. We have introduced a **Python Flask API** to handle heavy AI processing (Pinterest scraping & Vision analysis) and created a **Unified Search Endpoint** in the Node.js backend to route requests intelligently.

---

## 🔄 System Architecture

The system now operates on a 3-tier architecture:

1.  **Frontend (React)**: Port 3000
2.  **Backend (Node/Express)**: Port 5000
3.  **AI Service (Python/Flask)**: Port 5001

```mermaid
graph LR
    A[Frontend (App.js)] -- POST /api/unified-search --> B[Node Backend (server.js)]
    B -- Regex Check --> C{Is Pinterest URL?}
    C -- Yes --> D[Python API (pinterest_api.py)]
    C -- No --> E[Etsy Dummy Search]
    D -- Scrape & Analyze --> F[AI Model (Moondream2)]
    F -- Results --> D
    D -- JSON --> B
    B -- JSON --> A