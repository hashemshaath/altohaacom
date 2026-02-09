import { useState, useCallback, useEffect } from "react";

export interface CartItem {
  product_id: string;
  title: string;
  title_ar?: string | null;
  image_url?: string | null;
  price: number;
  currency: string;
  quantity: number;
  stock_quantity: number;
}

const CART_KEY = "altohaa_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: Math.min(i.quantity + qty, i.stock_quantity) }
            : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId
            ? { ...i, quantity: Math.min(quantity, i.stock_quantity) }
            : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice };
}
