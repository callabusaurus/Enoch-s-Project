import React from 'react';
import { BrainCircuit, Book, Clock, Target, Check } from 'lucide-react';

// You would typically install lucide-react with:
// npm install lucide-react
// or
// yarn add lucide-react

// Main App Component
export function PricingPage() {
  const plans = [
    {
      icon: Book,
      iconColor: "text-purple-600",
      tag: "Quick Access Plan",
      tagClasses: "bg-gray-100 text-gray-800",
      title: "Last-Night Preparer",
      description: "Survive tomorrow's paper.",
      price: "₹99",
      priceDetails: "", // Empty as requested
      features: [
        "100 Tutor Credits",
        "25 Atlas Credits",
        "Two Personalized AI Tutors",
        "2 File Uploads per day"
      ],
      buttonText: "Prepare Now",
      buttonClasses: "bg-slate-900 hover:bg-slate-800 text-white",
      highlighted: false,
    },
    {
      icon: Clock,
      iconColor: "text-purple-600",
      tag: "Most Popular During Exam Season",
      tagClasses: "bg-slate-900 text-white",
      title: "Exam Sprint Plan*",
      description: "Ace your semester in weeks.",
      price: "₹250",
      priceDetails: "",
      features: [
        "200 Tutor credits",
        "100 atlas credits",
        "Upto 4 Personalized AI tutors",
        "20 File uploads a day"
      ],
      buttonText: "Start Sprint",
      buttonClasses: "bg-purple-600 hover:bg-purple-700 text-white",
      highlighted: false,
    },
    {
      icon: Target,
      iconColor: "text-purple-600", // Changed from green to purple
      tag: "Best for Serious Learners",
      tagClasses: "bg-purple-600 text-white", // Changed from green to purple
      title: "Term Mastery Plan",
      description: "Full-term AI mentorship.",
      price: "₹2000",
      priceDetails: "",
      features: [
        "2000 tutor credits",
        "1000 Atlas credits",
        "Unlimited Personalized AI tutors",
        "Unlimited file uploads"
      ],
      buttonText: "Get Full Access",
      buttonClasses: "bg-purple-600 hover:bg-purple-700 text-white", // Changed from green to purple
      highlighted: true,
      highlightClasses: "border-2 border-purple-500 bg-purple-50" // Changed from green to purple
    }
  ];

  return (
    <div className="bg-white font-sans min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl shadow-lg mb-6">
            <BrainCircuit className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Choose Your Learning Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered tutor that adapts to your pace and deadlines.
          </p>
        </header>

        {/* Pricing Cards Section */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-md mx-auto lg:max-w-none">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </main>

      </div>
    </div>
  );
}

// Individual Pricing Card Component
interface PricingCardProps {
  icon: React.ElementType;
  iconColor: string;
  tag: string;
  tagClasses: string;
  title: string;
  description: string;
  price: string;
  priceDetails?: string;
  features: string[];
  buttonText: string;
  buttonClasses: string;
  highlighted: boolean;
  highlightClasses?: string;
}

function PricingCard({
  icon: Icon,
  iconColor,
  tag,
  tagClasses,
  title,
  description,
  price,
  priceDetails,
  features,
  buttonText,
  buttonClasses,
  highlighted,
  highlightClasses = ""
}: PricingCardProps) {
  
  const cardBaseClasses = "border rounded-2xl p-6 md:p-8 flex flex-col shadow-lg transition-all duration-300";
  const cardHighlightClasses = highlighted ? highlightClasses : "border-gray-200 bg-white";

  return (
    <div className={`${cardBaseClasses} ${cardHighlightClasses}`}>
      
      {/* Card Header */}
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 ${highlighted ? 'bg-white' : ''}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className={`text-xs font-semibold px-3 py-1 rounded-full ${tagClasses}`}>
          {tag}
        </div>
      </div>

      {/* Title & Description */}
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-gray-600 mt-1 mb-4">{description}</p>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {priceDetails && (
          <span className="text-base text-gray-500 ml-1">{priceDetails}</span>
        )}
      </div>

      {/* Features List */}
      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-purple-100 rounded-full mr-3">
              <Check className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <button className={`w-full py-3 px-5 rounded-lg font-semibold transition-colors duration-300 ${buttonClasses}`}>
        {buttonText}
      </button>
    </div>
  );
}


