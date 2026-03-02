// import React, { createContext, useContext, useState, useEffect } from 'react';

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//     const [cartItems, setCartItems] = useState(() => {
//         const stored = localStorage.getItem("cartItems");
//         return stored ? JSON.parse(stored) : [];
//     });

//     useEffect(() => {
//         localStorage.setItem("cartItems", JSON.stringify(cartItems));
//     }, [cartItems]);

//     const addToCart = (service) => {
//         setCartItems(prev => [...prev, {
//             id: service.id,
//             title: service.title,
//             price: service.price,
//             image: service.image
//         }]);
//     };

//     const removeFromCart = (id) => {
//         setCartItems(prev => prev.filter(i => i.id !== id));
//     };

//     const updateQuantity = (id, delta) => {
//         setCartItems(prev =>
//             prev
//                 .map(i =>
//                     i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
//                 )
//                 .filter(i => i.quantity > 0)
//         );
//     };

//     const clearCart = () => {
//         setCartItems([]);
//         localStorage.removeItem("cartItems"); // optional: also clear from localStorage
//     };  

//     return (
//         <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
//             {children}
//         </CartContext.Provider>
//     );
// };

// export const useCart = () => useContext(CartContext);

/////////////////////////////////////////////////////////////////////////////

import React, { createContext, useContext, useState, useEffect } from 'react';
// import OfferSceenPopUp from '../components/OfferScreenPopUp';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const stored = localStorage.getItem("cartItems");
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (service) => {
        setCartItems(prev => [...prev, {
            id: service.id,
            title: service.title,
            price: service.price,
            image: service.image
        }]);
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev =>
            prev
                .map(i =>
                i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
                )
                .filter(i => i.quantity > 0)
        );
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem("cartItems"); // optional: also clear from localStorage
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {/* <OfferSceenPopUp /> */}
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
