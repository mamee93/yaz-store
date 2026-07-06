import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageTone: string;
  imageUrl?: string;
  imageAlt?: string;
  sizeLabel: string;
};

type AddToCartInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: AddToCartInput) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const quantityToAdd = item.quantity ?? 1;
          const existingItem = state.items.find(
            (cartItem) => cartItem.productId === item.productId
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.productId === item.productId
                  ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
                  : cartItem
              )
            };
          }

          return {
            items: [...state.items, { ...item, quantity: quantityToAdd }]
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId)
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId ? { ...item, quantity } : item
                )
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: "oud-yaz-cart",
      partialize: (state) => ({ items: state.items })
    }
  )
);
