<<<<<<< HEAD
# MEDITRACKER
Built an AI-powered MERN-based healthcare system for medication tracking, adherence monitoring, and smart reminders, featuring doctor appointment booking, payment integration, emergency services, and real-time analytics.
=======
# MediTracker

MediTracker is a **full-stack health management application** designed to help users track their medications, manage health routines, and receive intelligent reminders. It combines **Google & JWT authentication, AI assistance, notifications, rewards, and analytics** to improve medication adherence and overall health management.

---

## 🌟 Features

- **Authentication**
  - Google OAuth login  
  - JWT-based secure authentication  
  - **Forget password via OTP sent to email**  
  - Password reset functionality  

- **Medication Management**
  - Add, edit, delete, and view medication history  
  - Set reminders for doses  
  - Track adherence over time  

- **AI Assistant**
  - Chatbot powered by AI to answer health and medication queries  
  - Provides personalized health tips and recommendations  

- **Notifications**
  - Email notifications for upcoming or missed doses  
  - Reward notifications for consistent adherence  

- **Reward System**
  - Earn points or rewards for taking medications on time  

- **Analytics**
  - Visual dashboards showing medication adherence trends  
  - Insights to optimize health routines  

- **Responsive Frontend**
  - Works seamlessly on mobile and desktop devices  
  - Built with React and Tailwind CSS  

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Vite  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Authentication:** Google OAuth & JWT  
- **Notifications:** Email & Push notifications  
- **AI Assistant:** Custom AI-powered chatbot  
- **Analytics:** Custom dashboards  



---


## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- npm or yarn
- MongoDB

### Backend Setup

- cd backend
- npm install
- cp .env.example .env    # Add your environment variables
- npm run dev

### Frontend Setup

- cd frontend
- npm install
- cp .env.example .env    # Add Firebase & API keys
- npm run dev

### Environment Variables
## Backend.env

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
OPENAI_API_KEY=your_openai_api_key
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

## Frontend.env

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id



>>>>>>> 13ecc7878de3000beb44d5c2a41b83556df1f15c
