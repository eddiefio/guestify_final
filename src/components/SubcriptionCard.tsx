import { Check } from "lucide-react"

interface SubscriptionCardProps {
  id: string
  title: string
  price: string
  period: string
  features: string[]
  buttonText: string
  isPrimary: boolean
  badge?: string
  savings?: string
  isSelected: boolean
  onSelect: (id: string) => void
  onCheckout: (id: string, price: string) => void
}

export default function SubscriptionCard({
  id,
  title,
  price,
  period,
  features,
  buttonText,
  isPrimary,
  badge,
  savings,
  isSelected,
  onSelect,
  onCheckout,
}: SubscriptionCardProps) {
  const isHighlighted = isSelected || (isPrimary && !isSelected)

  return (
    <div
      onClick={() => onSelect(id)}
      className={`rounded-2xl overflow-hidden shadow-lg transition-all cursor-pointer ${isSelected
        ? "border-2 border-[#5E2BFF] ring-4 ring-[#5E2BFF]/20 transform scale-105"
        : isPrimary
          ? "border-2 border-[#5E2BFF]"
          : "border border-gray-200"
        } ${isPrimary && !isSelected ? "relative" : isSelected ? "relative" : ""}`}
    >
      {badge && (
        <div
          className="absolute top-0 right-0 bg-[#ffde59] text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg"
          style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}
        >
          {badge}
        </div>
      )}

      {isSelected && (
        <div
          className="absolute top-0 left-0 bg-[#5E2BFF] text-white text-xs font-bold px-3 py-1 rounded-br-lg"
          style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}
        >
          SELECTED
        </div>
      )}

      <div className="p-6 md:p-8">
        <h2
          className="text-xl font-bold mb-4 text-gray-900"
          style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}
        >
          {title}
        </h2>

        <div className="mb-6">
          <div className="flex items-end">
            <span
              className="text-4xl font-bold text-gray-900"
              style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}
            >
              {price}
            </span>
            <span className="text-gray-600 ml-2">{period}</span>
          </div>

          {savings && <div className="mt-2 text-sm font-medium text-[#5E2BFF]">{savings}</div>}
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div
                className={`flex-shrink-0 h-5 w-5 rounded-full ${isHighlighted ? "bg-[#5E2BFF]" : "bg-gray-200"
                  } flex items-center justify-center mt-0.5`}
              >
                <Check className={`h-3 w-3 ${isHighlighted ? "text-white" : "text-gray-600"}`} />
              </div>
              <span
                className="ml-3 text-gray-700"
                style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 500 }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent card selection when clicking the button
            if (isSelected) {
              onCheckout(id, price)
            }
          }}
          disabled={!isSelected}
          className={`w-full py-3 px-4 rounded-xl transition-colors font-bold ${isSelected ? "bg-[#5E2BFF] text-white hover:bg-[#4a22cc]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
