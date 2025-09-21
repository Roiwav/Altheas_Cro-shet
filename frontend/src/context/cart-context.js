import { createContext, useContext } from 'react';

// Create and export the context
export const CartContext = createContext();

// Export the hook that provides access to the context
export const useCart = () => useContext(CartContext);
