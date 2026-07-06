import { CreditCard, MessageCircle, Wallet } from "lucide-react";
import { Card } from "@/components/ui";
import { paymentMethods } from "./static-checkout";

const methodIcons = [Wallet, CreditCard, MessageCircle];

export function PaymentMethodSelector() {
  return (
    <Card className="p-5">
      <h2 className="font-display text-2xl font-bold text-oud-brown">طريقة الدفع</h2>
      <div className="mt-5 grid gap-3">
        {paymentMethods.map((method, index) => {
          const Icon = methodIcons[index];

          return (
            <label
              key={method.id}
              className="flex cursor-pointer gap-3 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 transition focus-within:border-oud-gold hover:border-oud-gold/35"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                defaultChecked={index === 0}
                className="mt-1 size-4 accent-oud-brown"
              />
              <span className="grid size-10 shrink-0 place-items-center rounded-oud bg-oud-beige/45 text-oud-brown">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold text-oud-brown">{method.label}</span>
                <span className="mt-1 block text-xs leading-6 text-oud-muted">
                  {method.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
