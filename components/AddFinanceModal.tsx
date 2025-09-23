"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { FinanceItem } from "@/app/page"

interface AddFinanceModalProps {
  onSave: (item: Omit<FinanceItem, "id"> | FinanceItem) => void
  onClose: () => void
  editingItem?: FinanceItem | null
  onDelete?: (id: string) => void
}

export default function AddFinanceModal({ onSave, onClose, editingItem, onDelete }: AddFinanceModalProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [error, setError] = useState("")

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setAmount(editingItem.amount.toString())
      setCurrency(editingItem.currency)
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

    if (editingItem) {
      onSave({
        ...editingItem,
        name: name.trim(),
        amount: numAmount,
        currency,
      })
    } else {
      onSave({
        name: name.trim(),
        amount: numAmount,
        currency,
      })
    }
  }

  const handleDelete = () => {
    if (editingItem && onDelete) {
      onDelete(editingItem.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-y-auto">
      <div className="bg-[#222222] rounded-[20px] w-full max-w-sm p-6 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-lg font-medium">{editingItem ? "Edit Finance" : "Add Finance"}</h2>
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

          <div className="flex gap-2">
            {["Dollar", "Euro", "Uan"].map((curr, index) => {
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
