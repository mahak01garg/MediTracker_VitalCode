import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { AuthProvider, useAuth } from './context/AuthContext';
import { MedicationProvider } from './context/MedicationContext';
import ScrollToTop from './components/common/ScrollToTop';
import PrivateRoute from './components/common/PrivateRoute';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Medications from './pages/Medications';
import AddMedication from './pages/AddMedication';
import EditMedication from './pages/EditMedication';
import ChatbotPage from './pages/Chatbot';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Schedule from './pages/Schedule';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ChangePassword from './pages/ChangePassword';
import Appointments from './pages/Appointments';
import SearchDoctors from './pages/SearchDoctors';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import AvailableSlots from './pages/AvailableSlots';
import AmbulanceBooking from './pages/AmbulanceBooking';
import NearbyHospitals from './pages/NearbyHospitals';
import DoctorSlotsManager from './pages/DoctorSlotsManager';

import { requestNotificationPermission } from "./utils/notification";
import './App.css';
import Support from './pages/Support';
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/Welcome";

const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to={user.role === 'doctor' ? '/appointments' : '/dashboard'} replace />;

  return <Welcome />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const publicShellPages = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = publicShellPages.includes(location.pathname);

  // Notification permission
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isAuthPage) {
      requestNotificationPermission();
    }
  }, [location.pathname]);

  if (isAuthPage) return <div className="min-h-screen">{children}</div>;

  return (
  <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
    <Navbar />

    <div className="flex flex-1">
      <Sidebar />

      <main
        className={`
          flex-1 p-4 md:p-6 lg:p-8
          text-gray-900 dark:text-gray-100
          bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_40%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.08),_transparent_35%)]
        `}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  </div>
);}




function App() {

  // return (
    
  //   <LocalizationProvider dateAdapter={AdapterDayjs}>
  //      <ScrollToTop />
  //     <AuthProvider>
  //       <MedicationProvider>
  //         <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
  //           <Routes>
  //             <Route path="/login" element={<Login />} />
  //             <Route path="/register" element={<Register />} />
  //             <Route path="/forgot-password" element={<ForgotPassword />} />
  //             <Route path="/reset-password" element={<ResetPassword />} />

  //             <Route element={<ProtectedRoute />}>
  //               <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  //               <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
  //               <Route path="/medications" element={<PrivateRoute><Medications /></PrivateRoute>} />
  //               <Route path="/medications/add" element={<PrivateRoute><AddMedication /></PrivateRoute>} />
  //               <Route path="/medications/edit/:id" element={<PrivateRoute><EditMedication /></PrivateRoute>} />
  //               <Route path="/chatbot" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
  //               <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
  //               <Route path="/settings" element={<PrivateRoute><Settings darkMode={darkMode} setDarkMode={setDarkMode} /></PrivateRoute>} />
  //               <Route path="/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
  //               <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
  //               <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
  //             </Route>

  //             <Route path="*" element={<Navigate to="/" replace />} />
  //           </Routes>
  //         </Layout>
  //       </MedicationProvider>
  //     </AuthProvider>
  //   </LocalizationProvider>
  // );
  return (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <ScrollToTop />
    <AuthProvider>
      <MedicationProvider>
        <Layout>
          {/* 🔥 Add Toaster here */}
          <Toaster position="top-right" reverseOrder={false} />

          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<PrivateRoute allowedRoles={['patient']}><Dashboard /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute allowedRoles={['patient']}><AnalyticsDashboard /></PrivateRoute>} />
              <Route path="/medications" element={<PrivateRoute allowedRoles={['patient']}><Medications /></PrivateRoute>} />
              <Route path="/medications/add" element={<PrivateRoute allowedRoles={['patient']}><AddMedication /></PrivateRoute>} />
              <Route path="/medications/edit/:id" element={<PrivateRoute allowedRoles={['patient']}><EditMedication /></PrivateRoute>} />
              <Route path="/chatbot" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/schedule" element={<PrivateRoute allowedRoles={['patient']}><Schedule /></PrivateRoute>} />
              <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
              <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
              <Route path="/appointments/search" element={<PrivateRoute allowedRoles={['patient']}><SearchDoctors /></PrivateRoute>} />
              <Route path="/appointments/slots" element={<PrivateRoute allowedRoles={['patient']}><AvailableSlots /></PrivateRoute>} />
              <Route path="/appointments/book/:doctorId" element={<PrivateRoute allowedRoles={['patient']}><BookAppointment /></PrivateRoute>} />
              <Route path="/appointments/my-appointments" element={<PrivateRoute><MyAppointments /></PrivateRoute>} />
              <Route path="/appointments/manage-slots" element={<PrivateRoute allowedRoles={['doctor']}><DoctorSlotsManager /></PrivateRoute>} />
              <Route path="/ambulance-booking" element={<PrivateRoute><AmbulanceBooking /></PrivateRoute>} />
              <Route path="/nearby-hospitals" element={<PrivateRoute><NearbyHospitals /></PrivateRoute>} />
              <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </MedicationProvider>
    </AuthProvider>
  </LocalizationProvider>
);

}
export default App;
