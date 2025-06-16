"use client"

import SubscriptionCard from "@/components/SubcriptionCard"
import { useAuth } from "@/contexts/AuthContext";
import { createAPIResource } from "@/utils/axios-interceptor";
import { SubscriptionStatus } from "@/utils/enums";
import { Check } from "lucide-react"
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

export default function PurchaseSubscription() {
  const { session, user, subscriptionInfo } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter()

  const features = [
    "Save time answering the same guest questions",
    "Unlimited properties",
    "Full access to all features",
    "No commission on extra services",
    "Cancel anytime",
  ];

  const handleSelectPlan = (id: string) => {
    setSelectedPlan(id);
  };

  const handleCheckout = async (id: string, price: string) => {
    if (isRedirecting) return;
    if (!user || !session) {
      alert("Please log in to proceed with the checkout.");
      return;
    }

    if (!selectedPlan) {
      alert("Please select a plan before proceeding.");
      return;
    }
    try {

      setIsRedirecting(true);
      const payload = {
        user_id: user?.id,
        plan: selectedPlan,
      };
      const APIResource = createAPIResource(session.access_token)

      const apiResponse = await APIResource.post('/create-stripe-checkout', payload)
      if (!apiResponse?.data?.url) {
        throw new Error('Failed to create checkout session');
      }
      const stripeUrl = apiResponse.data.url;
      window.location.href = stripeUrl;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("There was an error processing your request. Please try again.");
    } finally {
      setIsRedirecting(false);
    }
  };
  // check the subscription status for active, trialing

  useLayoutEffect(() => {
    setIsLoading(true);
    if (subscriptionInfo) {
      const { status } = subscriptionInfo;
      const {
        ACTIVE,
        PENDING,
        TRIALING,
        UNPAID,
        CANCELLED,
      } = SubscriptionStatus
      const redirectUrl = status === ACTIVE || status === TRIALING ? "/dashboard" :
        status === PENDING || status === UNPAID ? "/dashboard/profile" : null;
      if (redirectUrl) {
        router.replace(redirectUrl);
      }
    }
    setIsLoading(false);
  }, [subscriptionInfo]);


  if (isLoading) {
    return (
      // animated loading screen
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5E2BFF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-12 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <h1
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}
          >
            Choose Your Plan
          </h1>
          <p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 500 }}
          >
            Select the perfect subscription that fits your needs. Upgrade anytime or cancel whenever you want.
          </p>
          {!selectedPlan && <p className="mt-4 text-[#5E2BFF] font-medium">Please select a plan to continue</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <SubscriptionCard
            id="monthly"
            title="Monthly Plan"
            price="€9.90"
            period="per month"
            features={features}
            buttonText={isRedirecting && selectedPlan === "monthly" ? "Redirecting..." : "Start your 14-day free trial"}
            isPrimary={selectedPlan === "monthly"}
            isSelected={selectedPlan === "monthly"}
            onSelect={handleSelectPlan}
            onCheckout={handleCheckout}
          />

          {/* Yearly Plan */}
          <SubscriptionCard
            id="yearly"
            title="Yearly Plan"
            price="€89.90"
            period="per year"
            features={features}
            buttonText={isRedirecting && selectedPlan === "yearly" ? "Redirecting..." : "Start your 14-day free trial"}
            isPrimary={selectedPlan === "yearly"}
            badge={selectedPlan === "yearly" ? "BEST VALUE" : undefined}
            savings="Save €28.90 compared to monthly"
            isSelected={selectedPlan === "yearly"}
            onSelect={handleSelectPlan}
            onCheckout={handleCheckout}
          />
        </div>

        <div className="mt-16 text-center">
          
          <p className="text-gray-600 max-w-lg mx-auto">
            All plans come with a 14-day free trial. Cancel anytime during your trial and you won't be charged.
          </p>

        </div>
      </main>
    </div>
  )
}
