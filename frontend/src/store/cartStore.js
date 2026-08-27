import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getCart as getCartApi,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
} from "../services/cartApi.js";
import toast from "react-hot-toast";

const useCartStore = create(
  persist(
    (set, get) => ({
      // For logged-in users: cart items from backend
      cart: [],
      // For non-logged-in users: temporary cart (cart items)
      tempCart: [],
      loading: false,

      // Initialize cart from backend if user is logged in
      initializeCart: async (user) => {
        if (!user) {
          // If user logs out, clear backend cart but keep temp cart
          set({ cart: [] });
          return;
        }

        try {
          set({ loading: true });
          const response = await getCartApi();
          set({ cart: response.data.cart || [], loading: false });

          // Merge temp cart with backend cart on login
          const tempCart = get().tempCart;
          if (tempCart.length > 0) {
            // Add temp items to backend cart
            for (const item of tempCart) {
              try {
                await addToCartApi(
                  item.productId || item.product?._id || item.product,
                  item.quantity,
                  item.size,
                  item.color
                );
              } catch (err) {
                console.error("Error syncing temp cart item:", err);
              }
            }
            // Clear temp cart after syncing
            set({ tempCart: [] });
            // Refresh cart
            const refreshResponse = await getCartApi();
            set({ cart: refreshResponse.data.cart || [] });
          }
        } catch (err) {
          console.error("Error initializing cart:", err);
          set({ loading: false });
        }
      },

      // Add to cart (handles both logged in and logged out)
      addToCart: async (
        productId,
        quantity = 1,
        size = null,
        color = null,
        user,
        productData = null
      ) => {
        if (user) {
          // Logged in: add to backend
          try {
            await addToCartApi(productId, quantity, size, color);
            const response = await getCartApi();
            set({ cart: response.data.cart || [] });
            toast.success("Added to cart!");
          } catch (err) {
            toast.error(err.message || "Failed to add to cart");
          }
        } else {
          // Not logged in: add to temp cart
          const tempCart = get().tempCart;
          const existingItemIndex = tempCart.findIndex(
            (item) =>
              (item.productId || item.product?._id || item.product) ===
                productId &&
              item.size === (size || null) &&
              item.color === (color || null)
          );

          if (existingItemIndex !== -1) {
            // Update quantity if item already exists
            const updatedCart = [...tempCart];
            updatedCart[existingItemIndex].quantity += quantity;
            // Preserve product data if it exists, otherwise update if productData is provided
            if (productData && (!updatedCart[existingItemIndex].product || !updatedCart[existingItemIndex].product.title)) {
              updatedCart[existingItemIndex].product = productData;
            }
            set({ tempCart: updatedCart });
          } else {
            // Add new item to temp cart with full product data if available
            set((state) => ({
              tempCart: [
                ...state.tempCart,
                {
                  tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  productId,
                  product: productData || { _id: productId },
                  quantity,
                  size: size || null,
                  color: color || null,
                },
              ],
            }));
          }
          toast.success("Added to cart!");
        }
      },

      // Update cart item quantity
      updateCartItem: async (itemId, quantity, user) => {
        if (user) {
          // Logged in: update in backend
          try {
            await updateCartItemApi(itemId, quantity);
            const response = await getCartApi();
            set({ cart: response.data.cart || [] });
            toast.success("Cart updated");
          } catch (err) {
            toast.error(err.message || "Failed to update cart");
          }
        } else {
          // Not logged in: update in temp cart
          const tempCart = get().tempCart;
          const itemIndex = tempCart.findIndex(
            (item) => item._id === itemId || item.tempId === itemId
          );
          if (itemIndex !== -1) {
            const updatedCart = [...tempCart];
            updatedCart[itemIndex].quantity = quantity;
            set({ tempCart: updatedCart });
            toast.success("Cart updated");
          }
        }
      },

      // Remove from cart (handles both logged in and logged out)
      removeFromCart: async (itemId, user) => {
        if (user) {
          // Logged in: remove from backend
          try {
            await removeFromCartApi(itemId);
            const response = await getCartApi();
            set({ cart: response.data.cart || [] });
            toast.success("Removed from cart");
          } catch (err) {
            toast.error(err.message || "Failed to remove from cart");
          }
        } else {
          // Not logged in: remove from temp cart
          set((state) => ({
            tempCart: state.tempCart.filter(
              (item) => item._id !== itemId && item.tempId !== itemId
            ),
          }));
          toast.success("Removed from cart");
        }
      },

      // Clear cart
      clearCart: async (user, suppressToast = false) => {
        if (user) {
          // Logged in: clear backend cart
          try {
            await clearCartApi();
            set({ cart: [] });
          } catch (err) {
            toast.error(err.message || "Failed to clear cart");
          }
        } else {
          // Not logged in: clear temp cart
          set({ tempCart: [] });
          if (!suppressToast) {
            toast.success("Cart cleared");
          }
        }
      },

      // Get all cart items (combines both)
      getAllCartItems: () => {
        const { cart, tempCart } = get();
        return [...cart, ...tempCart];
      },

      // Get total cart count
      getCartCount: () => {
        const { cart, tempCart } = get();
        const allItems = [...cart, ...tempCart];
        return allItems.reduce(
          (total, item) => total + (item.quantity || 1),
          0
        );
      },

      // Get total cart price
      getCartTotal: () => {
        const { cart, tempCart } = get();
        const allItems = [...cart, ...tempCart];
        return allItems.reduce((total, item) => {
          const product = item.product;
          if (!product) return total;
          const price = product.discountedPrice || product.price || 0;
          return total + price * (item.quantity || 1);
        }, 0);
      },

      // Clear temp cart (when browser closes, handled by browser)
      clearTempCart: () => {
        set({ tempCart: [] });
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage so temp cart clears on browser close
      // Only persist tempCart, not cart (that comes from backend)
      partialize: (state) => ({ tempCart: state.tempCart }),
    }
  )
);

export default useCartStore;
