"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, Signal, Wifi, Battery, Loader2 } from "lucide-react"
import { formatAmountInUSD } from "@/lib/exchange-rates"
import { AuthComponent } from "./AuthComponent"

interface HeaderProps {
  totalBalance: number
  activeTab: "finance" | "subscriptions" | "revenue"
  monthlySubscriptions: number
  monthlyRevenue: number
  selectedDate: Date
  onDateChange: (date: Date) => void
  isLoading?: boolean // Added optional loading state prop
}

export default function Header({
  totalBalance,
  activeTab,
  monthlySubscriptions,
  monthlyRevenue,
  selectedDate,
  onDateChange,
  isLoading = false, // Default to false for backward compatibility
}: HeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  const getHeaderContent = () => {
    switch (activeTab) {
      case "finance":
        return {
          title: "Your balance",
          amount: totalBalance,
        }
      case "subscriptions":
        return {
          title: "Monthly spending",
          amount: monthlySubscriptions,
        }
      case "revenue":
        return {
          title: "Monthly income",
          amount: monthlyRevenue,
        }
      default:
        return {
          title: "Your balance",
          amount: totalBalance,
        }
    }
  }

  const handleTodayClick = () => {
    onDateChange(new Date())
    setIsCalendarOpen(false)
  }

  const { title, amount } = getHeaderContent()

  return (
    <div className="px-6 pt-4">
      {/* Mobile status bar */}
      <div className="flex justify-between items-center mb-8 text-white">
        <span className="text-lg font-medium">9:41</span>
        <div className="flex items-center gap-3">
          <AuthComponent />
          <div className="flex items-center gap-1">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <Battery className="w-6 h-3" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-primary text-base font-medium mb-2">{title}</h1>
          <div className="font-affect leading-none text-primary leading-6 font-mono text-2xl flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-gray-400">Converting...</span>
              </div>
            ) : (
              formatAmountInUSD(amount)
            )}
          </div>
        </div>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 border border-white rounded-full text-white hover:bg-white/10 transition-colors">
              <span className="text-base font-medium">{formatMonth(selectedDate)}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-[#222222] border-gray-600" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(newDate) => {
                if (newDate) {
                  onDateChange(newDate)
                }
                setIsCalendarOpen(false)
              }}
              className="rounded-md border-0"
              classNames={{
                months: "text-white",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center text-white",
                caption_label: "text-sm font-medium text-white",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 text-white hover:bg-white/10",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-white/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal text-white hover:bg-white/10 rounded-md",
                day_selected: "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black",
                day_today: "bg-white/20 text-white",
                day_outside: "text-gray-600",
                day_disabled: "text-gray-600",
                day_range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
                day_hidden: "invisible",
              }}
            />
            <div className="p-3 border-t border-gray-600">
              <button
                onClick={handleTodayClick}
                className="w-full px-4 py-2 bg-white text-black rounded-md hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Today
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
