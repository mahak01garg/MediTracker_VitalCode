// import React from 'react';

// const Card = ({ 
//     children, 
//     title, 
//     subtitle, 
//     actions,
//     variant = 'default',
//     padding = true,
//     className = '',
//     ...props 
// }) => {
//     const variants = {
//         default: 'bg-white border border-gray-200',
//         elevated: 'bg-white shadow-lg border border-gray-100',
//         filled: 'bg-gray-50 border border-gray-200',
//         gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'
//     };
    
//     const paddingClass = padding ? 'p-6' : '';
    
//     return (
//         <div 
//             className={`rounded-xl ${variants[variant]} ${paddingClass} ${className}`}
//             {...props}
//         >
//             {/* Header */}
//             {(title || subtitle || actions) && (
//                 <div className="flex justify-between items-start mb-4">
//                     <div>
//                         {title && (
//                             <h3 className="text-lg font-bold text-gray-900">
//                                 {title}
//                             </h3>
//                         )}
//                         {subtitle && (
//                             <p className="text-sm text-gray-600 mt-1">
//                                 {subtitle}
//                             </p>
//                         )}
//                     </div>
//                     {actions && (
//                         <div className="flex space-x-2">
//                             {actions}
//                         </div>
//                     )}
//                 </div>
//             )}
            
//             {/* Content */}
//             <div className={title || subtitle || actions ? '' : ''}>
//                 {children}
//             </div>
//         </div>
//     );
// };

// // Card Header Component
// Card.Header = ({ children, className = '' }) => (
//     <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
//         {children}
//     </div>
// );

// // Card Body Component
// Card.Body = ({ children, className = '' }) => (
//     <div className={className}>
//         {children}
//     </div>
// );

// // Card Footer Component
// Card.Footer = ({ children, className = '' }) => (
//     <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
//         {children}
//     </div>
// );

// export default Card;
import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  variant = 'default',
  padding = true,
  className = '',
  ...props
}) => {
  const variants = {
    default:
      'bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700',

    elevated:
      'bg-white shadow-lg border border-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:shadow-none',

    filled:
      'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700',

    gradient:
      'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 ' +
      'dark:from-gray-800 dark:to-gray-900 dark:border-gray-700'
  };

  const paddingClass = padding ? 'p-6' : '';

  return (
    <div
      className={`rounded-xl ${variants[variant]} ${paddingClass} ${className}`}
      {...props}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

/* ---------- Sub Components ---------- */

Card.Header = ({ children, className = '' }) => (
  <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

export default Card;

