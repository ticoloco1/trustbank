"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/cart";
import { cartItemId, parseCartItemAmounts } from "@/types/cart";

const STORAGE_KEY = "trustbank_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartItem =>
        x &&
        typeof x === "object" &&
        typeof x.type === "string" &&
        typeof x.reference_id === "string" &&
        typeof x.label === "string" &&
        typeof x.amount_usdc === "string"
    );
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

type CartContextValue = {
  items: CartItem[];
  totalUsdc: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (type: string, referenceId: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [items, mounted]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const id = cartItemId(item);
    setItems((prev) => {
      const exists = prev.some((i) => i.id === id);
      if (exists) return prev;
      return [...prev, { ...item, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const hasItem = useCallback(
    (type: string, referenceId: string) =>
      items.some((i) => i.type === type && i.reference_id === referenceId),
    [items]
  );

  const totalUsdc = useMemo(() => parseCartItemAmounts(items), [items]);

  const value = useMemo(
    () => ({
      items,
      totalUsdc,
      addItem,
      removeItem,
      clearCart,
      hasItem,
    }),
    [items, totalUsdc, addItem, removeItem, clearCart, hasItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
