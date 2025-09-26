// src/context/useUserAndCart.js
import { useContext } from 'react';
import { UserContext } from './UserContext';
import { CartContext } from './CartContext';

export const useUserAndCart = () => {
    const userContext = useContext(UserContext);
    const cartContext = useContext(CartContext);

    // This hook should only be used in components that are descendants of both providers.
    // The logout function is now moved here to have access to both contexts.
    return { ...userContext, ...cartContext };
};