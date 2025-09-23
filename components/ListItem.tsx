"use client"

import type React from "react"

import { useState, useRef, useMemo } from "react"
import type { FinanceItem, SubscriptionItem, RevenueItem } from "@/app/page"
import { useCurrencyConversion } from "@/hooks/use-exchange-rates"
import { formatAmountInUSD } from "@/lib/exchange-rates"
import { Loader2 } from "lucide-react"

type Tab = "finance" | "subscriptions" | "revenue"

interface ListItemProps {
  item: FinanceItem | SubscriptionItem | RevenueItem
  activeTab: Tab
  onClick: () => void
  onDelete: (id: string) => void
  selectedDate?: Date
}

export default function ListItem({ item, activeTab, onClick, onDelete, selectedDate }: ListItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  // Always use the original amount for display
  const amountToDisplay = item.amount
    
  // Only convert to USD for the USD display, not for the original currency display
  const { usdAmount, loading: conversionLoading, error } = useCurrencyConversion(amountToDisplay, item.currency)

  const formatAmount = (amount: number, currency: string) => {
    let symbol = "$"
    if (currency === "EUR") {
      symbol = "€"
    } else if (currency === "UAH") {
      symbol = "₴"
    }

    // Ensure we're displaying the exact amount without any rounding issues
    return `${symbol}${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const getCurrencySymbol = (currency: string) => {
    if (currency === "EUR") return "€"
    if (currency === "UAH") return "₴"
    return "$" // Default to USD
  }
  
  // Format the amount with the appropriate currency symbol
  const formattedAmount = useMemo(() => {
    const currencySymbol = getCurrencySymbol(item.currency)
    // Use the original amount directly for display without any modifications
    // Ensure we're using the exact amount entered by the user
    return `${currencySymbol}${Number(item.amount).toFixed(2)}`
  }, [item.currency, item.amount])

  const getPeriodText = (item: SubscriptionItem | RevenueItem) => {
    switch (item.period) {
      case "monthly":
        return "per month"
      case "yearly":
        return "per year"
      case "once":
        return "once"
      default:
        return ""
    }
  }

  const getNextPaymentDate = (subscription: SubscriptionItem) => {
    const repetitionDate = new Date(subscription.repetitionDate)
    const referenceDate = selectedDate || new Date() // Use selectedDate if available, fallback to today

    // Calculate next payment date based on period
    const nextPayment = new Date(repetitionDate)

    if (subscription.period === "monthly") {
      // Find next monthly occurrence from reference date
      while (nextPayment <= referenceDate) {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      }
    } else if (subscription.period === "yearly") {
      // Find next yearly occurrence from reference date
      while (nextPayment <= referenceDate) {
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
      }
    }

    // Format date as "21 Aug" or "14.08.2026" for far future dates
    const currentYear = referenceDate.getFullYear()
    const paymentYear = nextPayment.getFullYear()

    if (paymentYear === currentYear) {
      return nextPayment.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    } else {
      return nextPayment
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, ".")
    }
  }

  const getNextRevenueDate = (revenue: RevenueItem) => {
    if (!revenue.repetitionDate) return ""

    const repetitionDate = new Date(revenue.repetitionDate)
    const referenceDate = selectedDate || new Date() // Use selectedDate if available, fallback to today

    // Calculate next payment date based on period
    const nextPayment = new Date(repetitionDate)

    if (revenue.period === "monthly") {
      // Find next monthly occurrence from reference date
      while (nextPayment <= referenceDate) {
        nextPayment.setMonth(nextPayment.getMonth() + 1)
      }
    } else if (revenue.period === "yearly") {
      // Find next yearly occurrence from reference date
      while (nextPayment <= referenceDate) {
        nextPayment.setFullYear(nextPayment.getFullYear() + 1)
      }
    } else if (revenue.period === "once") {
      // For one-time payments, just return the original date if it's in the future
      if (repetitionDate > referenceDate) {
        const currentYear = referenceDate.getFullYear()
        const paymentYear = repetitionDate.getFullYear()

        if (paymentYear === currentYear) {
          return repetitionDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
        } else {
          return repetitionDate
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replace(/\//g, ".")
        }
      }
      return ""
    }

    // Format date as "21 Aug" or "14.08.2026" for far future dates
    const currentYear = referenceDate.getFullYear()
    const paymentYear = nextPayment.getFullYear()

    if (paymentYear === currentYear) {
      return nextPayment.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    } else {
      return nextPayment
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, ".")
    }
  }

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    currentX.current = e.touches[0].clientX
    const deltaX = currentX.current - startX.current

    // Only allow left swipe (negative deltaX)
    if (deltaX < 0) {
      const absDistance = Math.abs(deltaX)
      let resistance = 1

      if (absDistance > 80) {
        resistance = 0.4 // Strong resistance after 80px
      } else if (absDistance > 40) {
        resistance = 0.7 // Medium resistance after 40px
      }

      const maxSwipe = -140 // Increased max swipe distance
      const newTranslateX = Math.max(deltaX * resistance, maxSwipe)

      setTranslateX(newTranslateX)
      setShowDelete(absDistance > 30) // Show delete hint earlier
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)

    if (Math.abs(translateX) > 70) {
      // Animate to delete position with spring-like effect
      setTranslateX(-140)
      setTimeout(() => {
        onDelete(item.id)
      }, 150) // Faster deletion timing
    } else {
      // Reset position with smooth spring animation
      setTranslateX(0)
      setShowDelete(false)
    }
  }

  const handleClick = () => {
    if (Math.abs(translateX) > 10) {
      // Reset if swiped
      setTranslateX(0)
      setShowDelete(false)
    } else {
      onClick()
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className={`absolute inset-0 bg-gradient-to-l from-red-500 to-red-600 flex items-center justify-end pr-6 transition-all duration-200 ${
          showDelete ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <span className="text-white font-medium text-sm">Delete</span>
      </div>

      <div
        className="flex items-center gap-4 py-4 px-4 cursor-pointer transition-all duration-200"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-light font-sans">{getInitial(item.name)}</span>
        </div>

        <div className="flex-1">
          <div className="text-white text-base font-medium font-['Poppins']">{item.name}</div>
          {activeTab === "subscriptions" && (
            <div className="text-gray-400 text-sm">{getNextPaymentDate(item as SubscriptionItem)}</div>
          )}
          {activeTab === "revenue" && (
            <div className="text-gray-400 text-sm">{getNextRevenueDate(item as RevenueItem)}</div>
          )}
          {item.name === "Trustee" && (
            <div className="opacity-40 text-white text-xs font-normal font-['Inter'] leading-tight">Crypto wallet</div>
          )}
        </div>

        <div className="text-right">
          <div className="text-white text-base font-medium font-['Poppins']">
            {/* Display the exact amount entered by the user with the correct currency symbol */}
            {getCurrencySymbol(item.currency)}{Number(item.amount).toFixed(2)}
          </div>
          {item.currency !== "USD" && (
            <div className="text-gray-400 text-sm">
              {conversionLoading ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Converting...</span>
                </div>
              ) : error ? (
                <span>Error</span>
              ) : (
                formatAmountInUSD(usdAmount)
              )}
            </div>
          )}
          {activeTab === "subscriptions" && (
            <div className="text-gray-400 text-sm">{getPeriodText(item as SubscriptionItem)}</div>
          )}
          {activeTab === "revenue" && <div className="text-gray-400 text-sm">{getPeriodText(item as RevenueItem)}</div>}
        </div>
      </div>
    </div>
  )
}
