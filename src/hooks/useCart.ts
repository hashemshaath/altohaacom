import { useState, useCallback, useEffect, useMemo } from "react";
import { DEFAULT_CURRENCY } from "@/lib/currencyFormatter";

export interface CartItem {
  product_id: string;
  title: string;
  title_ar?: string | null;
  image_url?: string | null;
  price: number;
  compare_at_price?: number | null;
  discount_percent?: number;
  currency: string;
  quantity: number;
  stock_quantity: number;
  tax_rate?: number;
  tax_inclusive?: boolean;
}

const CART_KEY = "altoha_cart";

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
  const [discountCode, setDiscountCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
  } | null>(null);

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
    setAppliedDiscount(null);
    setDiscountCode("");
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      const taxRate = item.tax_rate || 0;
      if (item.tax_inclusive) {
        totalTax += lineTotal - lineTotal / (1 + taxRate / 100);
      } else {
        totalTax += lineTotal * (taxRate / 100);
      }
    });

    let discountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === "percentage") {
        discountAmount = subtotal * (appliedDiscount.value / 100);
      } else {
        discountAmount = Math.min(appliedDiscount.value, subtotal);
      }
    }

    const grandTotal = subtotal + totalTax - discountAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(grandTotal * 100) / 100,
    };
  }, [items, appliedDiscount]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice: totals.total,
    subtotal: totals.subtotal,
    taxAmount: totals.tax,
    discountAmount: totals.discount,
    discountCode,
    setDiscountCode,
    appliedDiscount,
    setAppliedDiscount,
  };
}
