
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
//const { setUser } = useAuth();

import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { requestNotificationPermission } from "../utils/notification";
// import { GoogleLogin } from '@react-oauth/google';
// import axios from 'axios';
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth } from "../firebase";
import PageDoodle from "../components/common/PageDoodle";



const Login = () => {
 //const { login, error: authError, setUser } = useAuth(); 
    const [role, setRole] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    
    const { login, error: authError ,setUser} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const from = location.state?.from?.pathname || '/dashboard';
    const getGoogleAuthUrl = (loginRole) =>
        `${import.meta.env.VITE_API_URL}/auth/google?role=${encodeURIComponent(loginRole)}`;

    const validateGoogleLoginRole = (data, loginRole) => {
        const returnedRole = String(data.user?.role || '').toLowerCase();
        if (returnedRole !== loginRole) {
            throw new Error(
                loginRole === 'doctor'
                    ? 'This Google account is not linked to a doctor account. Please choose the correct Doctor Google account.'
                    : 'This Google account is not linked to a patient account. Please choose the correct Patient Google account.'
            );
        }
    };

    const saveGoogleSession = (data) => {
        const googleUser = {
            ...data.user,
            role: String(data.user?.role || role).toLowerCase(),
            id: data.user?.id || data.user?._id,
            _id: data.user?._id || data.user?.id,
        };

        setUser(googleUser);
        localStorage.setItem('token', data.token);
        localStorage.setItem("user", JSON.stringify(googleUser));
        return googleUser;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        
        if (!email || !password) {
            setFormError('Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await login(email, password, role);
        setLoading(false);

        if (result.success) {
            const nextPath = result.data?.user?.role === 'doctor' ? '/appointments' : from;
            navigate(nextPath, { replace: true });
        } else {
            setFormError(result.error);
        }
    };

const handleGoogleLoginWithPopupArchive = async () => {
  try {
    setFormError("");
    setLoading(true);
    const loginRole = role;

    // 🔥 Step 1: Google provider
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // 🔥 Step 2: Firebase popup login
    const result = await signInWithPopup(auth, provider);

    // 🔥 Step 3: Get user
    const idToken = await result.user.getIdToken(true);

    const response = await fetch(getGoogleAuthUrl(loginRole), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ role: loginRole }),
    });

    const data = await response.json();
    console.log("Backend response:", response.status, data);

    if (!response.ok) {
        throw new Error(data.message || "Backend Google auth failed");
    }
    validateGoogleLoginRole(data, loginRole);

    // 🔥 Step 4/5: Save user and token
    const googleUser = saveGoogleSession(data);

    // 🔥 Step 6: Notifications (optional)
    requestNotificationPermission().catch((error) => {
        console.warn("Notification setup after Google login failed:", error);
    });

    // 🔥 Step 7: Redirect
    navigate(googleUser.role === 'doctor' ? '/appointments' : from, { replace: true });

  } catch (err) {
    console.error("❌ Google login error:", err);
    const popupCanceled = err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request';
    const popupBlocked = err?.code === 'auth/popup-blocked';

    if (popupCanceled) {
      setFormError('Google sign-in was cancelled. Please try again.');
    } else if (popupBlocked) {
      setFormError('Google sign-in popup was blocked. Please allow popups and try again.');
    } else {
      setFormError(err.message || "Google login failed");
    }
  } finally {
    setLoading(false);
  }
};


    const completeGoogleLogin = async (firebaseUser, redirectPath = from, loginRole = role) => {
        const idToken = await firebaseUser.getIdToken(true);

        const response = await fetch(getGoogleAuthUrl(loginRole), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ role: loginRole }),
        });

        const data = await response.json();
        console.log("Backend response:", response.status, data);

        if (!response.ok) {
            throw new Error(data.message || "Backend Google auth failed");
        }
        validateGoogleLoginRole(data, loginRole);

        const googleUser = saveGoogleSession(data);

        navigate(googleUser.role === 'doctor' ? '/appointments' : redirectPath, { replace: true });
        requestNotificationPermission().catch((error) => {
            console.warn("Notification setup after Google login failed:", error);
        });
    };

    useEffect(() => {
        let unsubscribe;

        const handleGoogleRedirectResult = async () => {
            const pendingGoogleLogin = sessionStorage.getItem("googleLoginPending") === "true";

            try {
                setFormError("");
                if (pendingGoogleLogin) {
                    setLoading(true);
                }

                const result = await getRedirectResult(auth);
                const redirectPath = sessionStorage.getItem("googleLoginRedirectPath") || from;
                const loginRole = sessionStorage.getItem("googleLoginRole") || role;

                if (result?.user) {
                    sessionStorage.removeItem("googleLoginPending");
                    sessionStorage.removeItem("googleLoginRedirectPath");
                    sessionStorage.removeItem("googleLoginRole");
                    await completeGoogleLogin(result.user, redirectPath, loginRole);
                    return;
                }

                if (!pendingGoogleLogin) {
                    return;
                }

                unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    try {
                        if (!firebaseUser) {
                            setLoading(false);
                            return;
                        }

                        sessionStorage.removeItem("googleLoginPending");
                        sessionStorage.removeItem("googleLoginRedirectPath");
                        sessionStorage.removeItem("googleLoginRole");
                        unsubscribe?.();
                        await completeGoogleLogin(firebaseUser, redirectPath, loginRole);
                    } catch (err) {
                        console.error("Google auth state login error:", err);
                        sessionStorage.removeItem("googleLoginPending");
                        sessionStorage.removeItem("googleLoginRedirectPath");
                        sessionStorage.removeItem("googleLoginRole");
                        setFormError(err.message || "Google login failed");
                        setLoading(false);
                    }
                });
            } catch (err) {
                console.error("Google redirect login error:", err);
                sessionStorage.removeItem("googleLoginPending");
                sessionStorage.removeItem("googleLoginRedirectPath");
                sessionStorage.removeItem("googleLoginRole");
                setFormError(err.message || "Google login failed");
                setLoading(false);
            } finally {
                if (!sessionStorage.getItem("googleLoginPending")) {
                    setLoading(false);
                }
            }
        };

        handleGoogleRedirectResult();
        return () => {
            unsubscribe?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const RedirectGoogleLogin = async () => {
        try {
            setFormError("");
            setLoading(true);

            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            sessionStorage.setItem("googleLoginPending", "true");
            sessionStorage.setItem("googleLoginRedirectPath", from);
            sessionStorage.setItem("googleLoginRole", role);
            await signInWithRedirect(auth, provider);
        } catch (err) {
            console.error("Google login error:", err);
            sessionStorage.removeItem("googleLoginPending");
            sessionStorage.removeItem("googleLoginRedirectPath");
            sessionStorage.removeItem("googleLoginRole");
            const popupBlocked = err?.code === 'auth/popup-blocked';
            if (popupBlocked) {
                setFormError('Google sign-in popup was blocked. Please allow popups and try again.');
            } else {
                setFormError(err.message || "Google login failed");
            }
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                            Secure sign in
                        </p>
                        <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Welcome Back</h1>
                        <p className="mt-2 text-slate-700 dark:text-slate-300">
                            Sign in to continue managing your medicines and appointments.
                        </p>
                    </div>
                    <PageDoodle type="security" className="hidden md:block" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="rounded-2xl border border-white/60 bg-white/85 p-7 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 lg:col-span-3">
                        {(formError || authError) && (
                            <div className="mb-6 flex items-start rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-950/40">
                                <FiAlertCircle className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" />
                                <p className="text-sm text-red-700 dark:text-red-300">{formError || authError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
                                {['patient', 'doctor'].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setRole(option)}
                                        className={`rounded-xl px-4 py-3 text-sm font-semibold capitalize transition ${
                                            role === option
                                                ? 'bg-white text-cyan-700 shadow dark:bg-slate-700 dark:text-cyan-300'
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {option} Login
                                    </button>
                                ))}
                            </div>

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                                icon={<FiMail className="w-5 h-5 text-gray-400" />}
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                icon={<FiLock className="w-5 h-5 text-gray-400" />}
                            />

                            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                    />
                                    <label htmlFor="remember" className="ml-2 text-sm text-slate-700 dark:text-slate-200">
                                        Remember me
                                    </label>
                                </div>
                                <Link to="/forgot-password" className="text-sm font-medium text-cyan-700 hover:underline dark:text-cyan-300">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" variant="primary" size="large" loading={loading} fullWidth>
                                Sign In
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-4 text-slate-500 dark:bg-slate-900 dark:text-slate-400">Or continue with</span>
                                </div>
                            </div>

                            <Button type="button" variant="outline" size="large" fullWidth onClick={handleGoogleLoginWithPopupArchive}>
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-slate-600 dark:text-slate-300">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-2xl border border-white/60 bg-white/85 p-6 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick Tips</h3>
                            <ul className="mt-4 space-y-3 text-slate-700 dark:text-slate-200">
                                <li className="flex items-start"><span className="mr-2 text-cyan-600">•</span>Use your registered email for faster access.</li>
                                <li className="flex items-start"><span className="mr-2 text-cyan-600">•</span>Enable reminders after login for best experience.</li>
                                <li className="flex items-start"><span className="mr-2 text-cyan-600">•</span>Use Google sign in for one-tap login.</li>
                            </ul>
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-cyan-600 to-emerald-600 p-6 text-white shadow-xl">
                            <h3 className="text-lg font-bold">Your health partner</h3>
                            <p className="mt-3 text-sm leading-6 text-cyan-50">
                                MediTracker helps you stay consistent with medication schedules, doctor appointments, and daily health habits.
                            </p>
                            <p className="mt-4 rounded-lg bg-white/20 px-3 py-2 text-sm">Encrypted. Reliable. Built for daily life.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
