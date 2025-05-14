"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Calendar, Clock, AlertCircle, CheckCircle, X } from "lucide-react"
import { SubscriptionPlan, SubscriptionStatus } from "@/utils/enums"

interface SubscriptionSectionProps {
  subscription?: any
  isLoading?: boolean
  onCancelSubscription?: () => Promise<void>
}

export default function SubscriptionSection({
  subscription,
  isLoading = false,
  onCancelSubscription,
}: SubscriptionSectionProps) {
  const [isCanceling, setIsCanceling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const handleCancelSubscription = async () => {
    if (!onCancelSubscription) return

    try {
      setIsCanceling(true)
      await onCancelSubscription()
      toast.success("Subscription canceled successfully")
      setShowCancelConfirm(false)
    } catch (error) {
      console.error("Error canceling subscription:", error)
      toast.error("Failed to cancel subscription")
    } finally {
      setIsCanceling(false)
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDaysRemaining = (date: Date | null | undefined) => {
    if (!date) return 0
    const now = new Date()
    const endDate = new Date(date)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getPlanDetails = () => {
    if (!subscription) return { name: "No active subscription", price: "" }

    return {
      name: subscription.plan_type === SubscriptionPlan.MONTHLY ? "Monthly Plan" : "Yearly Plan",
      price: subscription.plan_type === SubscriptionPlan.MONTHLY ? "€9.90/month" : "€89.90/year",
    }
  }

  const { name, price } = getPlanDetails()
  const isTrialActive = subscription?.status === SubscriptionStatus.TRIALING
  const daysRemaining = isTrialActive && subscription?.trial_end ? getDaysRemaining(subscription.trial_end) : 0

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Subscription</h2>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E2BFF]"></div>
        </div>
      ) : !subscription ? (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">You don't have an active subscription</p>
          <a
            href="/subscription"
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
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-[#ffde59] text-gray-900 rounded">TRIAL</span>
                )}
                {subscription.status === SubscriptionStatus.ACTIVE && !isTrialActive && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded">ACTIVE</span>
                )}
                {subscription.status === SubscriptionStatus.CANCELLED && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800 rounded">CANCELED</span>
                )}
                {subscription.status === SubscriptionStatus.UNPAID && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded">UNPAID</span>
                )}
                {subscription.status === SubscriptionStatus.PENDING && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">PENDING</span>
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
              ) : subscription.status === "active" ? (
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
                      You're currently in your 14-day free trial. You won't be charged until{" "}
                      {formatDate(subscription.trial_end)}.
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

            {(isTrialActive || subscription.status === SubscriptionStatus.ACTIVE) && !showCancelConfirm && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
              >
                {isTrialActive ? "Cancel Trial" : "Cancel Subscription"}
              </button>
            )}

            {showCancelConfirm && (
              <div className="mt-4 border border-red-200 rounded-md p-4 bg-red-50">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Are you sure you want to cancel?</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        {isTrialActive
                          ? "Your trial will end immediately and you'll lose access to premium features."
                          : "You'll still have access until the end of your current billing period."}
                      </p>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {isCanceling ? "Canceling..." : "Yes, Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
                      >
                        No, Keep Subscription
                      </button>
                    </div>
                  </div>
                  <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <span className="sr-only">Dismiss</span>
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
