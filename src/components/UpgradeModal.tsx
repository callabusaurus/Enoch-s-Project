import { X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: [
      "Limited messages per day",
      "Access to GPT-3.5",
      "Standard response time",
      "Community support",
    ],
    highlighted: false,
  },
  {
    name: "Go",
    price: "₹399",
    period: "per month",
    features: [
      "Unlimited messages",
      "Access to GPT-4",
      "Faster response time",
      "Priority support",
      "Advanced data analysis",
      "Custom GPTs",
    ],
    highlighted: true,
  },
  {
    name: "Plus",
    price: "₹1,999",
    period: "per month",
    features: [
      "Everything in Go",
      "Team collaboration (5 users)",
      "Admin controls",
      "Shared workspace",
      "Usage analytics",
      "API access",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹19,900",
    period: "per month",
    features: [
      "Everything in Plus",
      "Unlimited team members",
      "Advanced security",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    highlighted: false,
  },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [isBusinessPlan, setIsBusinessPlan] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-[#121212] border border-[#2A2A2A] p-0 rounded-[12px]">
        <DialogTitle className="sr-only">Upgrade Your Plan</DialogTitle>
        <DialogDescription className="sr-only">
          Choose a plan that fits your needs. Compare features and pricing across our Free, Go, Plus, and Pro plans.
        </DialogDescription>
        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#1E1E1E] text-[#A0A0A0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-[#EAEAEA] mb-4">Upgrade Your Plan</h2>
            <div className="flex items-center justify-center gap-3">
              <span className={`${!isBusinessPlan ? 'text-[#EAEAEA]' : 'text-[#A0A0A0]'}`}>
                Personal
              </span>
              <Switch
                checked={isBusinessPlan}
                onCheckedChange={setIsBusinessPlan}
              />
              <span className={`${isBusinessPlan ? 'text-[#EAEAEA]' : 'text-[#A0A0A0]'}`}>
                Business
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-[#181818] border rounded-[12px] p-6 ${
                  plan.highlighted
                    ? 'border-[#5A5BEF] shadow-[0_0_20px_rgba(90,91,239,0.3)]'
                    : 'border-[#2A2A2A]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5A5BEF] text-white px-3 py-1 rounded-full">
                    Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-[#EAEAEA] mb-2">{plan.name}</h3>
                  <div className="mb-1">
                    <span className="text-[#EAEAEA]">{plan.price}</span>
                  </div>
                  <div className="text-[#A0A0A0]">{plan.period}</div>
                </div>

                <Button
                  onClick={() => {
                    if (plan.name !== "Free") {
                      toast.success(`Upgrading to ${plan.name} plan...`, {
                        description: "You'll be redirected to payment"
                      });
                    }
                  }}
                  disabled={plan.name === "Free"}
                  className={`w-full mb-6 ${
                    plan.highlighted
                      ? 'bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white'
                      : 'bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#EAEAEA] border border-[#2A2A2A]'
                  }`}
                >
                  {plan.name === "Free" ? "Current Plan" : "Upgrade"}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#5A5BEF] flex-shrink-0 mt-0.5" />
                      <span className="text-[#A0A0A0]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
