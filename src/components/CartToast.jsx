import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const CartToast = ({ isVisible, onClose, message = "Item added to cart!" }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds

      return () => clearTimeout(timer);
    } else {
      // Delay hiding to allow for exit animation
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute top-full right-0 mt-1 z-50 transform transition-all duration-300 ${
        isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-2 opacity-0 scale-95'
      }`}
    >
      {/* Arrow pointing up to cart icon */}
      <div className="absolute -top-1 right-4 w-2 h-2 bg-green-50 dark:bg-green-900/20 border-l border-t border-green-200 dark:border-green-800 transform rotate-45"></div>
      
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 shadow-lg min-w-[180px] relative">
        <div className="flex items-center">
          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
          <span className="ml-2 text-xs font-medium text-green-800 dark:text-green-200">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartToast;
