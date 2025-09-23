"use client"

import ListItem from "./ListItem"
import type { FinanceItem, SubscriptionItem, RevenueItem } from "@/app/page"

type Tab = "finance" | "subscriptions" | "revenue"

interface ItemsListProps {
  items: (FinanceItem | SubscriptionItem | RevenueItem)[]
  activeTab: Tab
  monthlyTotal: number
  onItemClick: (item: FinanceItem | SubscriptionItem | RevenueItem) => void
  onItemDelete: (id: string) => void
  selectedDate?: Date
}

export default function ItemsList({ items, activeTab, onItemClick, onItemDelete, selectedDate }: ItemsListProps) {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case "finance":
        return "No assets added yet"
      case "subscriptions":
        return "No subscriptions added yet"
      case "revenue":
        return "No revenue sources added yet"
      default:
        return "No items added yet"
    }
  }

  return (
    <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {items.length === 0 ? (
        <div className="text-center text-[#B0B0B0] py-24 px-6 relative z-10 min-h-[200px] flex items-center justify-center">
          {getEmptyMessage()}
        </div>
      ) : (
        <div className="relative z-10 p-1">
          {items.map((item, index) => (
            <div key={item.id} className={index > 0 ? "border-t border-white/5" : ""}>
              <ListItem
                item={item}
                activeTab={activeTab}
                onClick={() => onItemClick(item)}
                onDelete={onItemDelete}
                selectedDate={selectedDate}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
