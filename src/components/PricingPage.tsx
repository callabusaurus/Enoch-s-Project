import { useState, useEffect, useRef } from "react";
import React from "react";
import { BrainCircuit, Book, Clock, Target, Check, Gift, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const pricingPlans = [
  {
    icon: Gift,
    iconBgColor: "#6b7280", // gray-500
    badge: "",
    badgeClasses: "",
    name: "Free",
    price: "Free",
    description: "Start your learning journey.",
    features: [
      "25 Tutor Credits",
      "10 Atlas Credits",
      "Access to upto one tutor",
      "1 File Upload per day",
    ],
    buttonText: "Your Current Plan",
    buttonBgColor: "#6b7280", // gray-500
    buttonHoverBgColor: "#4b5563", // gray-600
    buttonDarkBgColor: "#6b7280", // gray-500
    buttonDarkHoverBgColor: "#9ca3af", // gray-400
    checkmarkColor: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    highlighted: false,
  },
  {
    icon: Book,
    iconBgColor: "#9333ea", // purple-600
    badge: "Quick Access Plan",
    badgeClasses: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    name: "Last-Night Preparer",
    price: "₹99",
    description: "Survive tomorrow's paper.",
    features: [
      "100 Tutor Credits",
      "25 Atlas Credits",
      "Two Personalized AI Tutors",
      "2 File Uploads per day",
    ],
    buttonText: "Prepare Now",
    buttonBgColor: "#0f172a", // slate-900
    buttonHoverBgColor: "#1e293b", // slate-800
    buttonDarkBgColor: "#1e293b", // slate-800
    buttonDarkHoverBgColor: "#334155", // slate-700
    checkmarkColor: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    highlighted: false,
  },
  {
    icon: Clock,
    iconBgColor: "#9333ea", // purple-600
    badge: "Most Popular During Exam Season",
    badgeClasses: "bg-slate-900 text-white dark:bg-slate-700 dark:text-gray-100",
    name: "Exam Sprint Plan*",
    price: "₹250",
    description: "Ace your semester in weeks.",
    features: [
      "200 Tutor credits",
      "Upto 4 Personalized AI tutors",
      "20 File uploads a day",
    ],
    buttonText: "Start Sprint",
    buttonBgColor: "#9333ea", // purple-600
    buttonHoverBgColor: "#7e22ce", // purple-700
    buttonDarkBgColor: "#9333ea", // purple-600
    buttonDarkHoverBgColor: "#a855f7", // purple-500
    checkmarkColor: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    highlighted: false,
  },
  {
    icon: Target,
    iconBgColor: "#06b6d4", // cyan-500
    badge: "Best for Serious Learners",
    badgeBgColor: "#9333ea", // purple-600
    badgeDarkBgColor: "#9333ea", // purple-600
    name: "Term Mastery Plan",
    price: "₹2500",
    description: "Full-term AI mentorship.",
    features: [
      "2000 Tutor credits",
      "1000 Atlas credits",
      "Unlimited Personalized AI tutors",
      "Unlimited file uploads",
    ],
    buttonText: "Get Full Access",
    buttonBgColor: "#9333ea", // purple-600
    buttonHoverBgColor: "#7e22ce", // purple-700
    buttonDarkBgColor: "#9333ea", // purple-600
    buttonDarkHoverBgColor: "#a855f7", // purple-500
    checkmarkColor: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    highlighted: true,
    borderColor: "#a855f7", // purple-500
    borderDarkColor: "#a855f7", // purple-500
    cardBgColor: "#faf5ff", // purple-50
    cardDarkBgColor: "#3b0764", // purple-950
  },
];

// Payment Modal Component
interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
}

function PaymentModal({ open, onClose }: PaymentModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: '#000000',
              opacity: 1,
            }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="bg-white dark:bg-[#181818] pricing-payment-modal-bg border border-gray-200 dark:border-[#2A2A2A] pricing-payment-modal-border rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <style>{`
                @media (prefers-color-scheme: light), :not(.dark) {
                  .pricing-payment-modal-text-primary {
                    color: rgb(17, 24, 39) !important;
                  }
                  .pricing-payment-modal-text-secondary {
                    color: rgb(75, 85, 99) !important;
                  }
                  .pricing-payment-modal-bg {
                    background-color: rgb(255, 255, 255) !important;
                  }
                  .pricing-payment-modal-border {
                    border-color: rgb(229, 231, 235) !important;
                  }
                }
                .dark .pricing-payment-modal-text-primary {
                  color: #EAEAEA !important;
                }
                .dark .pricing-payment-modal-text-secondary {
                  color: #A0A0A0 !important;
                }
                .dark .pricing-payment-modal-bg {
                  background-color: #181818 !important;
                }
                .dark .pricing-payment-modal-border {
                  border-color: #2A2A2A !important;
                }
              `}</style>
              <div className="flex justify-end mb-4">
                <button
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">💳</div>
                <p className="pricing-payment-modal-text-primary text-lg font-medium mb-2">
                  Payments are coming soon!
                </p>
                <p className="pricing-payment-modal-text-secondary text-sm">
                  We're currently working on enabling Razorpay integration. Please hold on 🙂
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Individual Pricing Card Component
interface PricingCardProps {
  icon: React.ElementType;
  iconBgColor: string;
  badge: string;
  badgeClasses?: string;
  badgeBgColor?: string;
  badgeDarkBgColor?: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonBgColor: string;
  buttonHoverBgColor: string;
  buttonDarkBgColor: string;
  buttonDarkHoverBgColor: string;
  checkmarkColor: string;
  highlighted: boolean;
  borderColor?: string;
  borderDarkColor?: string;
  cardBgColor?: string;
  cardDarkBgColor?: string;
  onButtonClick?: () => void;
  isFreePlan?: boolean;
}

function PricingCardComponent({
  icon: Icon,
  iconBgColor,
  badge,
  badgeClasses,
  badgeBgColor,
  badgeDarkBgColor,
  name,
  price,
  description,
  features,
  buttonText,
  buttonBgColor,
  buttonHoverBgColor,
  buttonDarkBgColor,
  buttonDarkHoverBgColor,
  checkmarkColor,
  highlighted,
  borderColor,
  borderDarkColor,
  cardBgColor,
  cardDarkBgColor,
  onButtonClick,
  isFreePlan = false,
}: PricingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update styles based on dark mode
  useEffect(() => {
    const updateStyles = () => {
      const isDark = document.documentElement.classList.contains('dark');
      
      // Update card styles for highlighted card
      if (cardRef.current && highlighted && borderColor && cardBgColor) {
        if (isDark && borderDarkColor && cardDarkBgColor) {
          cardRef.current.style.borderWidth = '2px';
          cardRef.current.style.borderColor = borderDarkColor;
          cardRef.current.style.backgroundColor = cardDarkBgColor;
        } else {
          cardRef.current.style.borderWidth = '2px';
          cardRef.current.style.borderColor = borderColor;
          cardRef.current.style.backgroundColor = cardBgColor;
        }
      }
      
      // Update badge styles
      if (badgeRef.current && badgeBgColor) {
        badgeRef.current.style.backgroundColor = isDark && badgeDarkBgColor ? badgeDarkBgColor : badgeBgColor;
      }
      
      // Update button initial style
      if (buttonRef.current) {
        buttonRef.current.style.backgroundColor = isDark ? buttonDarkBgColor : buttonBgColor;
      }
    };

    updateStyles();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateStyles);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [highlighted, borderColor, borderDarkColor, cardBgColor, cardDarkBgColor, badgeBgColor, badgeDarkBgColor, buttonBgColor, buttonDarkBgColor]);

  const cardBaseClasses = "relative border rounded-2xl p-6 md:p-8 flex flex-col shadow-lg transition-all duration-300 hover:shadow-xl";
  
  const cardHighlightClasses = highlighted 
    ? "" 
    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900";

  // Button hover handler
  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = document.documentElement.classList.contains('dark');
    e.currentTarget.style.backgroundColor = isDark ? buttonDarkHoverBgColor : buttonHoverBgColor;
  };
  
  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = document.documentElement.classList.contains('dark');
    e.currentTarget.style.backgroundColor = isDark ? buttonDarkBgColor : buttonBgColor;
  };

  return (
    <div 
      ref={cardRef}
      className={`${cardBaseClasses} ${cardHighlightClasses}`}
    >
      {/* Card Header with Icon and Badge */}
      <div className="flex justify-between items-start mb-4">
        {/* Icon - Top Left */}
        <div 
          className="flex items-center justify-center w-12 h-12 rounded-xl shadow-md"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {/* Badge - Top Right */}
        {badge && (
          <div 
            ref={badgeRef}
            className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClasses || ''}`}
            style={badgeBgColor ? { backgroundColor: badgeBgColor } : undefined}
          >
            {badge}
          </div>
        )}
      </div>

      {/* Title & Description */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{name}</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{description}</p>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">{price}</span>
      </div>

      {/* Features List */}
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full mr-3 ${checkmarkColor}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <button 
        ref={buttonRef}
        className="w-full py-3 px-5 rounded-lg font-semibold transition-colors duration-300 text-white"
        style={{ backgroundColor: buttonBgColor }}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        onClick={(e) => {
          const isDark = document.documentElement.classList.contains('dark');
          e.currentTarget.style.backgroundColor = isDark ? buttonDarkBgColor : buttonBgColor;
          
          // Only show payment modal for paid plans
          if (!isFreePlan && onButtonClick) {
            onButtonClick();
          }
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

// Main Pricing Page Component
export function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState<string>('repeat(1, minmax(0, 1fr))');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    const updateGridColumns = () => {
      if (window.innerWidth >= 768) {
        setGridColumns('repeat(4, minmax(0, 1fr))');
      } else {
        setGridColumns('repeat(1, minmax(0, 1fr))');
      }
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const handleBackClick = () => {
    window.history.back();
  };

  const handlePaymentButtonClick = () => {
    setPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans relative">
      {/* Back Button - Fixed Top Left */}
      <button
        onClick={handleBackClick}
        className="fixed top-4 left-4 z-40 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#9333ea] dark:hover:text-[#9333ea] transition-colors bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-lg px-3 py-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-6"
            style={{ backgroundColor: '#9333ea' }} // purple-600
          >
            <BrainCircuit className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Choose Your Learning Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            AI-powered tutor that adapts to your pace and deadlines.
          </p>
        </header>

        {/* Pricing Cards Section */}
        <main 
          className="grid gap-8 max-w-6xl mx-auto"
          style={{ gridTemplateColumns: gridColumns }}
        >
          {pricingPlans.map((plan, index) => (
            <PricingCardComponent 
              key={index} 
              {...plan}
              isFreePlan={plan.name === "Free"}
              onButtonClick={handlePaymentButtonClick}
            />
          ))}
        </main>
      </div>

      {/* Payment Modal */}
      <PaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
    </div>
  );
}
