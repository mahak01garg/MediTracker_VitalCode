import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { FiUser, FiMail, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import PageDoodle from '../components/common/PageDoodle';

const Register = () => {
    const [formData, setFormData] = useState({
        role: 'patient',
        name: '',
        email: '',
        phone: '',
        specialization: '',
        experience: '',
        degree: '',
        age: '',
        gender: 'Female',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    const { register, error: authError } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (formData.role === 'doctor') {
            if (!formData.phone.trim()) newErrors.phone = 'Phone is required for doctors';
            if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
            if (!formData.experience) newErrors.experience = 'Experience is required';
            if (!formData.degree.trim()) newErrors.degree = 'Degree is required';
            if (!formData.age) newErrors.age = 'Age is required';
            if (!formData.gender) newErrors.gender = 'Gender is required';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (!formData.acceptTerms) {
            newErrors.acceptTerms = 'You must accept the terms and conditions';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const result = await register({
                role: formData.role,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                specialization: formData.specialization,
                experience: formData.experience,
                degree: formData.degree,
                age: formData.age,
                gender: formData.gender,
                password: formData.password
            });
            
            if (result.success) {
                navigate(formData.role === 'doctor' ? '/appointments' : '/dashboard');
            }
        } catch (err) {
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
        { label: 'Contains number', met: /\d/.test(formData.password) }
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">
                            Join MediTracker
                        </p>
                        <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">Create Your Account</h1>
                        <p className="mt-2 text-slate-700 dark:text-slate-300">
                            Start your health journey with reminders, appointments, and smart tracking.
                        </p>
                    </div>
                    <PageDoodle type="profile" className="hidden md:block" />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <Card className="lg:col-span-3 border border-white/60 bg-white/85 p-7 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                        {(authError || Object.keys(errors).length > 0) && (
                            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-950/40">
                                {authError && (
                                    <p className="flex items-center text-red-700 dark:text-red-300">
                                        <FiAlertCircle className="mr-2 h-5 w-5" />
                                        {authError}
                                    </p>
                                )}
                                {Object.keys(errors).map((key) => (
                                    errors[key] && <p key={key} className="mt-1 text-sm text-red-700 dark:text-red-300">{errors[key]}</p>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
                                {['patient', 'doctor'].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, role: option }))}
                                        className={`rounded-xl px-4 py-3 text-sm font-semibold capitalize transition ${
                                            formData.role === option
                                                ? 'bg-white text-cyan-700 shadow dark:bg-slate-700 dark:text-cyan-300'
                                                : 'text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {option} account
                                    </button>
                                ))}
                            </div>

                            <Input
                                label="Full Name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleInputChange}
                                error={errors.name}
                                required
                            />

                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                error={errors.email}
                                required
                            />

                            {formData.role === 'doctor' && (
                                <>
                                    <Input
                                        label="Phone Number"
                                        name="phone"
                                        type="text"
                                        placeholder="+919876543210"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        error={errors.phone}
                                        required
                                    />
                                    <Input
                                        label="Specialization"
                                        name="specialization"
                                        type="text"
                                        placeholder="Cardiologist"
                                        value={formData.specialization}
                                        onChange={handleInputChange}
                                        error={errors.specialization}
                                        required
                                    />
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                        <Input
                                            label="Experience"
                                            name="experience"
                                            type="number"
                                            placeholder="8"
                                            value={formData.experience}
                                            onChange={handleInputChange}
                                            error={errors.experience}
                                            required
                                        />
                                        <Input
                                            label="Age"
                                            name="age"
                                            type="number"
                                            placeholder="34"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            error={errors.age}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Degree"
                                        name="degree"
                                        type="text"
                                        placeholder="MBBS, MD"
                                        value={formData.degree}
                                        onChange={handleInputChange}
                                        error={errors.degree}
                                        required
                                    />
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Gender
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.gender && <p className="mt-1 text-sm text-red-600 dark:text-red-300">{errors.gender}</p>}
                                    </div>
                                </>
                            )}

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                error={errors.password}
                                required
                            />

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                error={errors.confirmPassword}
                                required
                            />

                            <div className="flex items-start rounded-lg bg-slate-50 p-3 dark:bg-slate-800/80">
                                <input
                                    type="checkbox"
                                    id="acceptTerms"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleInputChange}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <label htmlFor="acceptTerms" className="ml-2 text-sm text-slate-700 dark:text-slate-200">
                                    I agree to the{" "}
                                    <a href="/terms" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
                                        Terms of Service
                                    </a>{" "}
                                    and{" "}
                                    <a href="/privacy" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                            {errors.acceptTerms && <p className="text-sm text-red-600 dark:text-red-300">{errors.acceptTerms}</p>}

                            <Button type="submit" variant="primary" size="large" loading={loading} fullWidth>
                                Create Account
                            </Button>

                            <p className="text-center text-slate-600 dark:text-slate-300">
                                Already have an account?{" "}
                                <Link to="/login" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </Card>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border border-white/60 bg-white/85 p-6 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
                            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Password Checklist</h3>
                            <div className="space-y-2">
                                {passwordRequirements.map((req, index) => (
                                    <div key={index} className="flex items-center">
                                        <span
                                            className={`mr-3 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                                req.met
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                                    : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-300"
                                            }`}
                                        >
                                            {req.met ? "✓" : "•"}
                                        </span>
                                        <span className={`${req.met ? "text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="border border-white/60 bg-gradient-to-br from-cyan-600 to-emerald-600 p-6 text-white shadow-lg">
                            <h3 className="mb-4 text-lg font-bold">Why Join MediTracker?</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start"><FiCheck className="mr-2 mt-1 h-4 w-4" /> AI-powered medication reminders</li>
                                <li className="flex items-start"><FiCheck className="mr-2 mt-1 h-4 w-4" /> Health insights and analytics</li>
                                <li className="flex items-start"><FiCheck className="mr-2 mt-1 h-4 w-4" /> Emergency contact notifications</li>
                                <li className="flex items-start"><FiCheck className="mr-2 mt-1 h-4 w-4" /> Rewards for consistent adherence</li>
                            </ul>
                            <p className="mt-5 rounded-lg bg-white/20 px-3 py-2 text-sm">Your data is encrypted and secure.</p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
