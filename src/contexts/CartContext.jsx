import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Reset cart count when user logs out
  useEffect(() => {
    if (!isAuthenticated()) {
      setCartItemCount(0);
    }
  }, [isAuthenticated]);

  const value = {
    cartItemCount,
    setCartItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
