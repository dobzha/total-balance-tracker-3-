"use client"

type Tab = "finance" | "subscriptions" | "revenue"

interface TabSwitcherProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const tabs = [
    { id: "finance" as Tab, label: "Finance" },
    { id: "subscriptions" as Tab, label: "Subscriptions" },
    { id: "revenue" as Tab, label: "Revenue" },
  ]

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex space-x-4 min-w-max px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-sm font-medium px-6 py-3 rounded-full border-2 transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? "border-white text-white bg-transparent"
                : "border-gray-400 text-gray-200 hover:border-gray-300 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
