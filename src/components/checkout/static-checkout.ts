export type CheckoutItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageTone: string;
  sizeLabel: string;
};

export const paymentMethods = [
  {
    id: "cash_on_delivery",
    label: "الدفع عند الاستلام",
    description: "ادفع عند استلام الطلب بعد التأكيد."
  },
  {
    id: "bank_transfer",
    label: "التحويل البنكي",
    description: "سيتم إرسال بيانات التحويل بعد مراجعة الطلب."
  },
  {
    id: "manual_confirmation",
    label: "تأكيد عبر واتساب",
    description: "نتواصل معك عبر واتساب لتأكيد الطلب والدفع."
  }
];

export const deliveryFee = 2;

export function getCartSubtotal(items: CheckoutItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartTotal(items: CheckoutItem[]) {
  return getCartSubtotal(items) + deliveryFee;
}
