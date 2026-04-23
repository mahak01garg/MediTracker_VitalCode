# MediTracker Frontend

The MediTracker frontend is built with `React + Vite`. It provides a role-based user experience for both patients and doctors, including authentication, medication tracking, scheduling, appointments, profile management, AI assistance, notifications, ambulance booking, and nearby hospital discovery.

## Tech Stack

- React 18
- Vite
- React Router
- Tailwind CSS
- Material UI
- Firebase Cloud Messaging
- Axios
- Recharts
- React Hot Toast

## Core Features

- Role-based authentication for patients and doctors
- Patient dashboard with medications, schedule, and analytics
- Doctor-focused appointment and slot management
- AI assistant for health-related guidance
- Appointment search, booking, and booking management
- Profile and settings management
- Forgot password and reset password flows
- Push notifications via Firebase Cloud Messaging
- Ambulance booking and nearby hospitals pages

## Routes Overview

### Public Routes

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### Patient Routes

- `/dashboard`
- `/analytics`
- `/medications`
- `/medications/add`
- `/medications/edit/:id`
- `/schedule`
- `/appointments/search`
- `/appointments/slots`
- `/appointments/book/:doctorId`

### Shared Authenticated Routes

- `/chatbot`
- `/profile`
- `/settings`
- `/change-password`
- `/appointments`
- `/appointments/my-appointments`
- `/ambulance-booking`
- `/nearby-hospitals`
- `/support`

### Doctor Routes

- `/appointments/manage-slots`

## Project Structure

```text
frontend/
├── public/                  # Static assets and service worker
├── src/
│   ├── api/                 # API request helpers
│   ├── assets/              # Images and local assets
│   ├── components/          # Reusable UI components
│   │   ├── ai/
│   │   ├── common/
│   │   ├── layout/
│   │   └── medications/
│   ├── context/             # Auth, theme, medication, and notification state
│   ├── hooks/               # Reusable React hooks
│   ├── pages/               # Route-level pages
│   ├── services/            # Service wrappers
│   ├── styles/              # Shared styling files
│   └── utils/               # Helpers, notifications, and axios utilities
├── index.html
├── package.json
└── vite.config.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create an environment file

Create a `.env` file inside the `frontend/` directory.

Example:

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000/api
VITE_API_PROXY_TARGET=http://127.0.0.1:5001

VITE_GOOGLE_CLIENT_ID=your_google_client_id

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## Environment Variables

- `VITE_API_URL`: Primary backend API base URL used across authentication, notifications, analytics, and page requests
- `VITE_API_BASE_URL`: Alternate API base URL used in some API helpers
- `VITE_BACKEND_URL`: Fallback backend URL used by utility axios instances
- `VITE_API_PROXY_TARGET`: Vite development proxy target for `/api`
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase authentication domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Firebase application ID
- `VITE_FIREBASE_VAPID_KEY`: Firebase web push VAPID key
- The Firebase messaging service worker is generated at build time from the `VITE_FIREBASE_*` values above

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Serves the production build locally for verification.

```bash
npm run lint
```

Runs ESLint using the project script.

## Development Notes

- The app root is wrapped with `AuthProvider`, `MedicationProvider`, `LocalizationProvider`, and `Toaster`
- The home route automatically redirects authenticated users:
- Patients are redirected to `/dashboard`
- Doctors are redirected to `/appointments`
- The navbar and sidebar are role-aware
- Firebase messaging token registration depends on valid frontend environment values and working backend notification endpoints
- The backend is expected to expose authentication, profile, appointments, notifications, and medication-related endpoints

## Backend Expectations

The frontend integrates with endpoints such as:

- `/auth/*`
- `/appointments/*`
- `/notifications/*`
- `/user/*`
- Other medication and analytics-related `/api` routes

Make sure the backend environment, API URLs, and CORS configuration are aligned with the frontend setup.

## Known Note

The current ESLint script uses legacy flags, and the repository may also have ESLint configuration compatibility issues. If `npm run lint` fails, check the installed ESLint version and the `eslint.config.js` setup.

## Suggested Local Workflow

1. Start the backend server.
2. Configure the frontend `.env` file.
3. Run `npm install`.
4. Start the frontend with `npm run dev`.
5. Verify both patient and doctor flows.

## Maintainer Tips

- When updating role-based navigation, verify `src/App.jsx`, `src/components/layout/Navbar.jsx`, and `src/components/layout/Sidebar.jsx` together
- For authentication changes, start with `src/context/AuthContext.jsx` and `src/api/auth.js`
- For push notification issues, check `src/firebase.js`, `src/hooks/useFCM.js`, and the generated `dist/firebase-messaging-sw.js`
