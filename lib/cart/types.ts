export interface CartItem {
  _id: string;
  productId: string;
  variantId: string | null;
  selectedOptions: Record<string, string>;
  quantity: number;
  price: number;
  name: string;
  image: string | null;
}

export interface Cart {
  userId: string;
  storeId: string;
  items: CartItem[];
}
