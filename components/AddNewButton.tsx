"use client"

import { Plus } from "lucide-react"

interface AddNewButtonProps {
  onClick: () => void
}

export default function AddNewButton({ onClick }: AddNewButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[30px] left-[30px] right-[30px] bg-white text-black h-14 rounded-full flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform font-medium text-lg"
    >
      <span>Add new</span>
      <Plus className="w-5 h-5" />
    </button>
  )
}
