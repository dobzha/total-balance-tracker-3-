"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, Check } from "lucide-react"
import type { SubscriptionItem, FinanceItem } from "@/app/page"

interface AddSubscriptionModalProps {
  onSave: (item: Omit<SubscriptionItem, "id"> | SubscriptionItem) => void
  onClose: () => void
  editingItem?: SubscriptionItem | null
  financeAccounts: FinanceItem[]
  onDelete?: (id: string) => void
}

export default function AddSubscriptionModal({
  onSave,
  onClose,
  editingItem,
  financeAccounts,
  onDelete,
}: AddSubscriptionModalProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly")
  const [repetitionDate, setRepetitionDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0] // Format as YYYY-MM-DD
  })
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [error, setError] = useState("")
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setAmount(editingItem.amount.toString())
      setCurrency(editingItem.currency)
      setPeriod(editingItem.period)
      setRepetitionDate(editingItem.repetitionDate.split("T")[0])
      setSelectedAccountId(editingItem.accountId || "")
    }
  }, [editingItem])

  const handleSave = () => {
    if (!name.trim() || !amount.trim()) {
      setError("Please fill in all fields")
      return
    }

    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount)) {
      setError("Please enter a valid amount")
      return
    }

    if (financeAccounts.length > 0 && !selectedAccountId) {
      setError("Please select an account")
      return
    }

    if (editingItem) {
      onSave({
        ...editingItem,
        name: name.trim(),
        amount: numAmount,
        currency,
        period,
        repetitionDate: new Date(repetitionDate).toISOString(),
        accountId: selectedAccountId || undefined,
      })
    } else {
      onSave({
        name: name.trim(),
        amount: numAmount,
        currency,
        period,
        repetitionDate: new Date(repetitionDate).toISOString(),
        accountId: selectedAccountId || undefined,
      })
    }
  }

  const handleDelete = () => {
    if (editingItem && onDelete) {
      onDelete(editingItem.id)
      onClose()
    }
  }

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".")
  }

  const periodOptions = [
    { value: "monthly", label: "Per month" },
    { value: "yearly", label: "Per year" },
  ]

  const selectedPeriodLabel = periodOptions.find((p) => p.value === period)?.label || "Per day"

  const selectedAccount = financeAccounts.find((account) => account.id === selectedAccountId)
  const selectedAccountLabel = selectedAccount ? selectedAccount.name : "Choose one"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-y-auto">
      <div className="bg-[#222222] rounded-[20px] w-full max-w-sm p-6 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-lg font-medium">{editingItem ? "Edit Subscription" : "Add Subscription"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white text-sm mb-2 block">Name</label>
            <input
              type="text"
              placeholder="Text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Quantity</label>
            <input
              type="number"
              placeholder="Number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-white focus:outline-none"
            />
          </div>

          <div className="relative">
            <label className="text-white text-sm mb-2 block">Period</label>
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white text-sm text-left flex items-center justify-between focus:border-white focus:outline-none"
            >
              {selectedPeriodLabel}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showPeriodDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#222222] border border-gray-600 rounded-lg overflow-hidden z-10">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPeriod(option.value as "monthly" | "yearly")
                      setShowPeriodDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left text-white text-sm hover:bg-gray-700 flex items-center justify-between"
                  >
                    {option.label}
                    {period === option.value && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Repetition</label>
            <div className="relative">
              <input
                type="date"
                value={repetitionDate}
                onChange={(e) => setRepetitionDate(e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white text-sm focus:border-white focus:outline-none appearance-none"
                style={{
                  colorScheme: "dark",
                }}
              />
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="relative">
            <label className="text-white text-sm mb-2 block">Account</label>
            {financeAccounts.length === 0 ? (
              <div className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-gray-500 text-sm">
                Create a finance first
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white text-sm text-left flex items-center justify-between focus:border-white focus:outline-none"
                >
                  {selectedAccountLabel}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showAccountDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#222222] border border-gray-600 rounded-lg overflow-hidden z-10">
                    {financeAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountId(account.id)
                          setShowAccountDropdown(false)
                        }}
                        className="w-full px-4 py-3 text-left text-white text-sm hover:bg-gray-700 flex items-center justify-between"
                      >
                        {account.name}
                        {selectedAccountId === account.id && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            {["Dollar", "Euro", "Uan"].map((curr) => {
              const currencyValue = curr === "Dollar" ? "USD" : curr === "Euro" ? "EUR" : "UAH"
              return (
                <button
                  key={curr}
                  onClick={() => setCurrency(currencyValue)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    currency === currencyValue
                      ? "bg-white text-black"
                      : "bg-transparent border border-gray-600 text-gray-400 hover:text-white hover:border-white"
                  }`}
                >
                  {curr}
                </button>
              )
            })}
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className={`mt-6 ${editingItem ? "flex gap-3" : ""}`}>
            {editingItem && onDelete && (
              <button
                onClick={handleDelete}
                className="flex-1 bg-transparent border border-gray-600 text-white py-3 rounded-full font-medium text-sm hover:bg-red-500 hover:border-red-500 transition-all"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              className={`bg-white text-black py-3 rounded-full font-medium text-sm hover:opacity-90 transition-opacity ${
                editingItem ? "flex-1" : "w-full"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
