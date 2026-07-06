import React, { createContext, useContext, useState, useCallback } from 'react';

const CartToastContext = createContext();

export const useCartToast = () => {
  const context = useContext(CartToastContext);
  if (!context) {
    throw new Error('useCartToast must be used within a CartToastProvider');
  }
  return context;
};

export const CartToastProvider = ({ children }) => {
  const [cartToast, setCartToast] = useState({
    isVisible: false,
    message: 'Item added to cart!'
  });

  const showCartToast = useCallback((message = 'Item added to cart!') => {
    setCartToast({
      isVisible: true,
      message
    });
  }, []);

  const hideCartToast = useCallback(() => {
    setCartToast(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const value = {
    cartToast,
    showCartToast,
    hideCartToast
  };

  return (
    <CartToastContext.Provider value={value}>
      {children}
    </CartToastContext.Provider>
  );
};
