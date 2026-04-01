import React from 'react';
import Chatbot from '../components/ai/Chatbot';
import Card from '../components/common/Card';
import { FiMessageSquare, FiHelpCircle, FiStar } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import { useTheme } from '../context/ThemeContext';
import DarkModeSwitch from '../components/common/DarkModeSwitch';
import PageDoodle from '../components/common/PageDoodle';

const ChatbotPage = () => {
    const exampleQuestions = [
        "What should I do if I forget to take my medication?",
        "Can I take this medication with food?",
        "What are the common side effects of pain relievers?",
        "How should I store my insulin?",
        "Is it safe to take vitamins with prescription medications?",
        "What time of day is best for blood pressure medication?",
        "How do I know if I'm having an allergic reaction to medication?",
        "Can I drink alcohol while taking antibiotics?",
        "What should I do if I experience severe side effects?",
        "How can I remember to take my medications regularly?"
    ];

    const tips = [
        "💡 Always consult with your healthcare provider for medical advice",
        "📅 Set multiple reminders for important medications",
        "📝 Keep a medication journal to track side effects",
        "🔄 Review your medications regularly with your doctor",
        "🚨 Know the signs of medication interactions"
    ];

    return (
  <div className="space-y-6
                  text-gray-900 dark:text-gray-100">

    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center
                       text-gray-900 dark:text-gray-100">
          <BsRobot className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
          AI Health Assistant
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get personalized medication advice and health insights
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <PageDoodle type="ai" className="hidden lg:block" />
        <span className="px-3 py-1 rounded-full text-sm font-medium
                         bg-green-100 dark:bg-green-900
                         text-green-800 dark:text-green-300">
          Free Tier Active
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium
                         bg-blue-100 dark:bg-blue-900
                         text-blue-800 dark:text-blue-300">
          Powered by Gemini
        </span>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Main Chatbot */}
      <div className="lg:col-span-2">
        <Chatbot />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">

        {/* Example Questions */}
        <Card>
          <div className="flex items-center mb-4">
            <FiMessageSquare className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Example Questions
            </h3>
          </div>

          <div className="space-y-3">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                className="block w-full text-left p-3 rounded-lg text-sm transition-colors
                           bg-gray-50 dark:bg-gray-800
                           hover:bg-gray-100 dark:hover:bg-gray-700
                           text-gray-700 dark:text-gray-200"
              >
                {question}
              </button>
            ))}
          </div>
        </Card>

        {/* Safety Tips */}
        <Card>
          <div className="flex items-center mb-4">
            <FiStar className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Important Safety Tips
            </h3>
          </div>

          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start">
                <div className="p-1 rounded mr-3 mt-0.5
                                bg-blue-100 dark:bg-blue-900">
                  <FiHelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <Card variant="filled">
          <div className="flex items-start">
            <div className="p-2 rounded-lg mr-3
                            bg-yellow-100 dark:bg-yellow-900">
              <FiHelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h4 className="font-bold mb-2
                             text-gray-900 dark:text-gray-100">
                Important Disclaimer
              </h4>
              <p className="text-sm
                            text-gray-600 dark:text-gray-400">
                MediTracker AI provides health information for educational purposes only.
                It is not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </Card>

        {/* AI Capabilities */}
        <Card>
          <h3 className="font-bold mb-4
                         text-gray-900 dark:text-gray-100">
            What I Can Help With
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg
                            bg-blue-50 dark:bg-blue-900">
              <p className="text-sm font-medium
                            text-blue-800 dark:text-blue-300">
                Medication Info
              </p>
            </div>
            <div className="p-3 rounded-lg
                            bg-green-50 dark:bg-green-900">
              <p className="text-sm font-medium
                            text-green-800 dark:text-green-300">
                Side Effects
              </p>
            </div>
            <div className="p-3 rounded-lg
                            bg-purple-50 dark:bg-purple-900">
              <p className="text-sm font-medium
                            text-purple-800 dark:text-purple-300">
                Interactions
              </p>
            </div>
            <div className="p-3 rounded-lg
                            bg-yellow-50 dark:bg-yellow-900">
              <p className="text-sm font-medium
                            text-yellow-800 dark:text-yellow-300">
                Adherence Tips
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  </div>
);
}


export default ChatbotPage
