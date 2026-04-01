import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiHeart, 
    FiGithub, 
    FiTwitter, 
    FiLinkedin,
    FiMail,
    FiGlobe,
    FiShield,
    FiBook
} from 'react-icons/fi';
import { APP_CONSTANTS } from '../../utils/constants';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        Product: [
            { label: 'Features', path: '/features' },
            { label: 'Pricing', path: '/pricing' },
            { label: 'API', path: '/api' },
            { label: 'Documentation', path: '/docs' }
        ],
        Company: [
            { label: 'About', path: '/about' },
            { label: 'Blog', path: '/blog' },
            { label: 'Careers', path: '/careers' },
            { label: 'Press', path: '/press' }
        ],
        Legal: [
            { label: 'Privacy Policy', path: '/privacy' },
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Cookie Policy', path: '/cookies' },
            { label: 'GDPR', path: '/gdpr' }
        ],
        Support: [
            { label: 'Help Center', path: '/help' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'Status', path: '/status' },
            { label: 'Community', path: '/community' }
        ]
    };

    const socialLinks = [
        { icon: <FiGithub className="w-5 h-5" />, label: 'GitHub', url: 'https://github.com' },
        { icon: <FiTwitter className="w-5 h-5" />, label: 'Twitter', url: 'https://twitter.com' },
        { icon: <FiLinkedin className="w-5 h-5" />, label: 'LinkedIn', url: 'https://linkedin.com' },
        { icon: <FiMail className="w-5 h-5" />, label: 'Email', url: `mailto:${APP_CONSTANTS.SUPPORT_EMAIL}` }
    ];

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-3">
                                <FiHeart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">MediTracker</h2>
                                <p className="text-gray-400">Your health companion</p>
                            </div>
                        </div>
                        <p className="text-gray-400 mb-6 max-w-md">
                            Helping millions manage their medications effectively with AI-powered reminders, 
                            health insights, and personalized care.
                        </p>
                        
                        {/* App Badges */}
                        <div className="flex space-x-4">
                            <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                </svg>
                                <span className="text-sm font-medium">App Store</span>
                            </button>
                            <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658l10.937 6.333-2.301 2.301-8.636-8.634z"/>
                                </svg>
                                <span className="text-sm font-medium">Google Play</span>
                            </button>
                        </div>
                    </div>

                    {/* Links Sections */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="text-white font-semibold mb-4">{category}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.path}
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 my-8"></div>

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <FiShield className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-sm text-gray-400">
                            HIPAA Compliant • End-to-End Encrypted
                        </span>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label={social.label}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>

                    {/* Copyright */}
                    <div className="text-sm text-gray-400 flex items-center">
                        <FiBook className="w-4 h-4 mr-2" />
                        <span>© {currentYear} MediTracker. All rights reserved.</span>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center items-center mt-8 space-x-6">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-400">99.9% Uptime</span>
                    </div>
                    <div className="flex items-center">
                        <FiGlobe className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-xs text-gray-400">Serving 50+ countries</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-400">1M+ Doses Tracked</span>
                    </div>
                </div>

                {/* Medical Disclaimer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500 max-w-3xl mx-auto">
                        ⚕️ <strong>Important:</strong> MediTracker is a medication management tool and does not provide 
                        medical advice, diagnosis, or treatment. Always consult a healthcare professional 
                        for medical concerns.
                    </p>
                </div>
            </div>
        </footer>
    );
};



export default Footer;
