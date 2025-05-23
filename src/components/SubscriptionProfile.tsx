"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Calendar, Clock, AlertCircle, CheckCircle, X } from "lucide-react"
import { SubscriptionPlan, SubscriptionStatus } from "@/utils/enums"

interface SubscriptionSectionProps {
  subscription?: any
  isLoading?: boolean
  onManageSubscription?: () => Promise<string | undefined>
}

export default function SubscriptionSection({
  subscription,
  isLoading = false,
  onManageSubscription,
}: SubscriptionSectionProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDaysRemaining = (end: string | null) => {
    if (!end) return 0
    const now = Date.now()
    const then = new Date(end).getTime()
    const diffDays = Math.ceil((then - now) / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getPlanDetails = () => {
    if (!subscription) return { name: "No active subscription", price: "" }

    return {
      name: subscription.plan_type === SubscriptionPlan.MONTHLY ? "Monthly Plan" : "Yearly Plan",
      price: subscription.plan_type === SubscriptionPlan.MONTHLY ? "€9.90/month" : "€89.90/year",
    }
  }

  const handleManageSubscription = async () => {
    if (!onManageSubscription) return
    try {
      setIsRedirecting(true)
      const url = await onManageSubscription()
      if (!url) throw new Error("No URL returned")
      window.location.href = url
    } catch (error) {
      console.error("Error redirecting to customer portal:", error)
      toast.error("Failed to redirect to subscription management.")
    } finally {
      setIsRedirecting(false)
    }
  }

  const { name, price } = getPlanDetails()

  // Only treat as “in trial” if Stripe says TRIALING *and* they haven’t consumed it yet
  const isTrialActive = subscription?.status === SubscriptionStatus.TRIALING && subscription?.trial_end && new Date(subscription.trial_end) > new Date()

  // Prefer the server‐computed days; fallback to date diff
  const daysRemaining = isTrialActive ? getDaysRemaining(subscription!.trial_end || subscription!.current_period_end) : 0

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Your Subscription
      </h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E2BFF]" />
        </div>
      ) : !subscription ? (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">
            You don't have an active subscription
          </p>
          <a
            href="/dashboard/subscription"
            className="inline-block py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5E2BFF] hover:bg-[#4a22cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
          >
            Choose a Plan
          </a>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">{name}</h3>
                {isTrialActive && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-[#ffde59] text-gray-900 rounded">
                    TRIAL
                  </span>
                )}
                {subscription.status === SubscriptionStatus.ACTIVE && !isTrialActive && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded">
                    ACTIVE
                  </span>
                )}
                {subscription.status === SubscriptionStatus.CANCELLED && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800 rounded">
                    CANCELLED
                  </span>
                )}
                {subscription.status === SubscriptionStatus.UNPAID && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded">
                    UNPAID
                  </span>
                )}
                {subscription.status === SubscriptionStatus.PENDING && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-gray-600">{price}</p>
            </div>

            <div className="mt-4 md:mt-0">
              {isTrialActive ? (
                <div className="flex items-center text-sm text-[#5E2BFF]">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining in trial
                  </span>
                </div>
              ) : subscription.status === SubscriptionStatus.ACTIVE ? (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Renews on {formatDate(subscription.current_period_end)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {isTrialActive && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      You’re in your free trial and won’t be charged until{" "}
                      {formatDate(subscription.trial_end)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700">Full access to all features</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700">Premium support</span>
              </div>
            </div>

            <button
              onClick={handleManageSubscription}
              disabled={isRedirecting}
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
            >
              {isRedirecting
                ? "Redirecting..."
                : subscription.status === SubscriptionStatus.ACTIVE || isTrialActive
                  ? "Manage Subscription"
                  : "View Subscription"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
