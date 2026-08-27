import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getWishlist as getWishlistApi,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from "../services/wishlistApi.js";
import toast from "react-hot-toast";

const useWishlistStore = create(
  persist(
    (set, get) => ({
      // For logged-in users: product IDs from backend
      wishlist: [],
      // For non-logged-in users: temporary wishlist (product IDs)
      tempWishlist: [],
      loading: false,

      // Initialize wishlist from backend if user is logged in
      initializeWishlist: async (user) => {
        if (!user) {
          // If user logs out, clear backend wishlist but keep temp wishlist
          set({ wishlist: [] });
          return;
        }

        try {
          set({ loading: true });
          const response = await getWishlistApi();
          const productIds = response.data.wishlist.map((p) =>
            typeof p === "object" ? p._id : p
          );
          set({ wishlist: productIds, loading: false });

          // Merge temp wishlist with backend wishlist on login
          const tempWishlist = get().tempWishlist;
          if (tempWishlist.length > 0) {
            // Add temp items to backend wishlist
            for (const productId of tempWishlist) {
              if (!productIds.includes(productId)) {
                try {
                  await addToWishlistApi(productId);
                } catch (err) {
                  console.error("Error syncing temp wishlist item:", err);
                }
              }
            }
            // Clear temp wishlist after syncing
            set({ tempWishlist: [] });
            // Refresh wishlist
            const refreshResponse = await getWishlistApi();
            const refreshedIds = refreshResponse.data.wishlist.map((p) =>
              typeof p === "object" ? p._id : p
            );
            set({ wishlist: refreshedIds });
          }
        } catch (err) {
          console.error("Error initializing wishlist:", err);
          set({ loading: false });
        }
      },

      // Check if product is in wishlist (handles both logged in and logged out)
      isInWishlist: (productId) => {
        const { wishlist, tempWishlist } = get();
        return wishlist.includes(productId) || tempWishlist.includes(productId);
      },

      // Add to wishlist (handles both logged in and logged out)
      addToWishlist: async (productId, user) => {
        if (user) {
          // Logged in: add to backend
          try {
            await addToWishlistApi(productId);
            set((state) => ({
              wishlist: [...state.wishlist, productId],
            }));
            toast.success("Added to wishlist");
          } catch (err) {
            toast.error(err.message || "Failed to add to wishlist");
          }
        } else {
          // Not logged in: add to temp wishlist
          set((state) => ({
            tempWishlist: [...state.tempWishlist, productId],
          }));
          toast.success("Added to wishlist");
        }
      },

      // Remove from wishlist (handles both logged in and logged out)
      removeFromWishlist: async (productId, user) => {
        if (user) {
          // Logged in: remove from backend
          try {
            await removeFromWishlistApi(productId);
            set((state) => ({
              wishlist: state.wishlist.filter((id) => id !== productId),
            }));
            toast.success("Removed from wishlist");
          } catch (err) {
            toast.error(err.message || "Failed to remove from wishlist");
          }
        } else {
          // Not logged in: remove from temp wishlist
          set((state) => ({
            tempWishlist: state.tempWishlist.filter((id) => id !== productId),
          }));
          toast.success("Removed from wishlist");
        }
      },

      // Toggle wishlist (add if not in, remove if in)
      toggleWishlist: async (productId, user) => {
        const { isInWishlist } = get();
        if (isInWishlist(productId)) {
          await get().removeFromWishlist(productId, user);
        } else {
          await get().addToWishlist(productId, user);
        }
      },

      // Get all wishlist product IDs (combines both)
      getAllWishlistIds: () => {
        const { wishlist, tempWishlist } = get();
        return [...new Set([...wishlist, ...tempWishlist])];
      },

      // Clear temp wishlist (when browser closes, handled by browser)
      clearTempWishlist: () => {
        set({ tempWishlist: [] });
      },
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage so temp wishlist clears on browser close
      // Only persist tempWishlist, not wishlist (that comes from backend)
      partialize: (state) => ({ tempWishlist: state.tempWishlist }),
    }
  )
);

export default useWishlistStore;

