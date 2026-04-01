
// import React, { useState } from "react";

// export default function Support() {
//   const [openIndex, setOpenIndex] = useState(null);

//   const faqs = [
//     {
//       q: "How do medication reminders work?",
//       a: "MediTracker sends reminders based on the schedule you set while adding a medication. Notifications must be enabled for best results."
//     },
//     {
//       q: "What should I do if I miss a dose?",
//       a: "Do not double the dose. Follow your doctor’s instructions and record the missed dose in the app."
//     },
//     {
//       q: "Can I edit or delete a medication?",
//       a: "Yes. Go to the Medications page, select a medication, and choose Edit or Delete."
//     },
//     {
//       q: "Is my health data secure?",
//       a: "Yes. Your data is securely stored and only accessible to you."
//     },
//     {
//       q: "Does MediTracker give medical advice?",
//       a: "No. MediTracker provides information and reminders but does not replace professional medical advice."
//     }
//   ];

//   return (
//     <div className="max-w-2xl mx-auto px-4">

//       {/* Title */}
//       <h1 className="text-2xl font-semibold mb-2">
//         Help & Support
//       </h1>
//       <p className="text-gray-600 dark:text-gray-400 mb-8">
//         Assistance, FAQs, and important information about MediTracker.
//       </p>

//       {/* Contact */}
//       <section className="mb-8">
//         <h2 className="text-lg font-medium mb-1">
//           Contact Support
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400">
//           For any issues or questions, email us at:
//         </p>
//         <p className="font-medium mt-1">
//           support@meditracker.com
//         </p>
//       </section>

//       <hr className="border-gray-200 dark:border-gray-700 mb-8" />

//       {/* FAQs */}
//       <section className="mb-8">
//         <h2 className="text-lg font-medium mb-4">
//           Frequently Asked Questions
//         </h2>

//         <div className="space-y-3">
//           {faqs.map((faq, index) => (
//             <div
//               key={index}
//               className="border border-gray-200 dark:border-gray-700 rounded-md"
//             >
//               <button
//                 className="w-full text-left px-4 py-3 font-medium flex justify-between items-center"
//                 onClick={() =>
//                   setOpenIndex(openIndex === index ? null : index)
//                 }
//               >
//                 {faq.q}
//                 <span className="text-gray-400">
//                   {openIndex === index ? "−" : "+"}
//                 </span>
//               </button>

//               {openIndex === index && (
//                 <div className="px-4 pb-3 text-gray-600 dark:text-gray-400">
//                   {faq.a}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </section>

//       <hr className="border-gray-200 dark:border-gray-700 mb-8" />

//       {/* Disclaimer */}
//       <section>
//         <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-1">
//           Medical Disclaimer
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400">
//           MediTracker is not a substitute for professional medical advice.
//           Always consult a licensed healthcare provider regarding
//           medications or health conditions.
//         </p>
//       </section>

//     </div>
//   );
// }
import React, { useState } from "react";
import PageDoodle from "../components/common/PageDoodle";
import { APP_CONSTANTS } from "../utils/constants";

export default function Support() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How do medication reminders work?",
      a: "MediTracker sends reminders based on the schedule you set while adding a medication. Notifications must be enabled for best results."
    },
    {
      q: "What should I do if I miss a dose?",
      a: "Do not double the dose. Follow your doctor’s instructions and record the missed dose in the app."
    },
    {
      q: "Can I edit or delete a medication?",
      a: "Yes. Go to the Medications page, select a medication, and choose Edit or Delete."
    },
    {
      q: "Is my health data secure?",
      a: "Yes. Your data is securely stored and only accessible to you."
    },
    {
      q: "Does MediTracker give medical advice?",
      a: "No. MediTracker provides information and reminders but does not replace professional medical advice."
    }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg">
      
      {/* Title */}
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          Help & Support
        </h1>
        <PageDoodle type="support" className="hidden md:block" />
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-8">
        Assistance, FAQs, and important information about MediTracker.
      </p>

      {/* Contact */}
      <section className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
          Contact Support
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          For any issues or questions, email us at:
        </p>
        <div className="mt-3 space-y-2">
          {APP_CONSTANTS.SUPPORT_CONTACTS.map((contact) => (
            <div key={contact.email} className="rounded-md bg-indigo-50 px-3 py-2 dark:bg-indigo-950/40">
              <p className="font-medium text-indigo-700 dark:text-indigo-300">
                {contact.name}
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-gray-700 underline decoration-indigo-400 underline-offset-2 dark:text-gray-300"
              >
                {contact.email}
              </a>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-300 dark:border-gray-700 mb-8" />

      {/* FAQs */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm"
            >
              <button
                className={`w-full text-left px-4 py-3 font-medium flex justify-between items-center transition-colors duration-200
                  ${openIndex === index ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'hover:bg-green-50 dark:hover:bg-green-950'}
                `}
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                {faq.q}
                <span className="text-gray-500 dark:text-gray-400 font-bold text-lg">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-4 pb-3 text-gray-700 dark:text-gray-300">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-300 dark:border-gray-700 mb-8" />

      {/* Disclaimer */}
      <section className="p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-1">
          Medical Disclaimer
        </h2>
        <p className="text-gray-700 dark:text-gray-300">
          MediTracker is not a substitute for professional medical advice.
          Always consult a licensed healthcare provider regarding
          medications or health conditions.
        </p>
      </section>
    </div>
  );
}

