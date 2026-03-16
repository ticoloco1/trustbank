export const CART_ITEM_TYPES = ["VIDEO_UNLOCK", "SLUG_CLAIM", "SLUG_PURCHASE", "MINISITE_SUBSCRIPTION"] as const;
export type CartItemType = (typeof CART_ITEM_TYPES)[number];

export interface CartItem {
  id: string;
  type: CartItemType;
  reference_id: string;
  label: string;
  amount_usdc: string;
}

export function cartItemId(item: Omit<CartItem, "id">): string {
  return `${item.type}:${item.reference_id}`;
}

export function parseCartItemAmounts(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (parseFloat(i.amount_usdc) || 0), 0);
}
