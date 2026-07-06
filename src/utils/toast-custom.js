import { toast } from 'react-toastify';

// Custom toast functions with specific colors
export const customToast = {
  success: (message, options = {}) => {
    toast.dismiss(); // Dismiss existing toasts first
    toast.success(message, {
      style: {
        background: '#10b981', // Custom green
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '8px 12px',
      },
      ...options
    });
  },

  error: (message, options = {}) => {
    toast.dismiss(); // Dismiss existing toasts first
    toast.error(message, {
      style: {
        background: '#ef4444', // Custom red
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '8px 12px',
      },
      ...options
    });
  },

  warning: (message, options = {}) => {
    toast.dismiss(); // Dismiss existing toasts first
    toast.warning(message, {
      style: {
        background: '#f59e0b', // Custom amber
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '8px 12px',
      },
      ...options
    });
  },

  info: (message, options = {}) => {
    toast.dismiss(); // Dismiss existing toasts first
    toast.info(message, {
      style: {
        background: '#3b82f6', // Custom blue
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '8px 12px',
      },
      ...options
    });
  },

  // Custom colors for specific use cases
  roleChange: (message) => {
    toast.dismiss(); // Dismiss existing toasts first
    toast.success(message, {
      style: {
        background: '#8b5cf6', // Purple for role changes
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '8px 12px',
      }
    });
  },

  orderUpdate: (message) => {
    toast.dismiss(); // Dismiss existing toasts first
    toast.success(message, {
      style: {
        background: '#059669', // Darker green for order updates
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '8px 12px',
      }
    });
  }
};
