"use client"

import { useState, useEffect } from "react"
import Header from "@/components/Header"
import TabSwitcher from "@/components/TabSwitcher"
import ItemsList from "@/components/ItemsList"
import AddNewButton from "@/components/AddNewButton"
import AddFinanceModal from "@/components/AddFinanceModal"
import AddSubscriptionModal from "@/components/AddSubscriptionModal"
import AddRevenueModal from "@/components/AddRevenueModal"
import { convertToUSD } from "@/lib/exchange-rates"
import { useAuth } from "@/contexts/AuthContext"
import { 
  financeItemsService, 
  subscriptionItemsService, 
  revenueItemsService, 
  loadAllUserData 
} from "@/lib/database"

// Helper function to save data to localStorage (fallback for non-authenticated users)
const saveToLocalStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

// Helper function to load data from localStorage (fallback for non-authenticated users)
const loadFromLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  }
  return []
}

export interface FinanceItem {
  id: string
  name: string
  amount: number
  currency: string
  calculatedAmount?: number // Dynamic calculated amount including subscriptions and revenue
}

export interface SubscriptionItem {
  id: string
  name: string
  amount: number
  currency: string
  period: "monthly" | "yearly"
  repetitionDate: string // ISO date string
  accountId?: string // Optional for backward compatibility
}

export interface RevenueItem {
  id: string
  name: string
  amount: number
  currency: string
  period: "monthly" | "yearly" | "once"
  repetitionDate?: string // ISO date string
  accountId?: string // Optional for backward compatibility
}

export interface Transaction {
  id: string
  type: "subscription" | "revenue"
  sourceId: string // ID of the subscription or revenue item
  accountId: string
  amount: number
  currency: string
  date: string // ISO date string
  description: string
}

type Tab = "finance" | "subscriptions" | "revenue"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("finance")
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([])
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionItem[]>([])
  const [revenueItems, setRevenueItems] = useState<RevenueItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FinanceItem | SubscriptionItem | RevenueItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoadingData, setIsLoadingData] = useState(false)

  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0)
  const [monthlySubscriptionsUSD, setMonthlySubscriptionsUSD] = useState(0)
  const [monthlyRevenueUSD, setMonthlyRevenueUSD] = useState(0)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [dateAwareFinanceItems, setDateAwareFinanceItems] = useState<FinanceItem[]>([])

  // Load data when user authentication state changes
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return // Wait for auth to finish loading
      
      setIsLoadingData(true)
      try {
        if (user) {
          // User is authenticated, load from database
          const data = await loadAllUserData()
          setFinanceItems(data.financeItems)
          setSubscriptionItems(data.subscriptionItems)
          setRevenueItems(data.revenueItems)
        } else {
          // User is not authenticated, load from localStorage
          setFinanceItems(loadFromLocalStorage('financeItems'))
          setSubscriptionItems(loadFromLocalStorage('subscriptionItems'))
          setRevenueItems(loadFromLocalStorage('revenueItems'))
        }
      } catch (error) {
        console.error('Error loading data:', error)
        // Fallback to localStorage on error
        setFinanceItems(loadFromLocalStorage('financeItems'))
        setSubscriptionItems(loadFromLocalStorage('subscriptionItems'))
        setRevenueItems(loadFromLocalStorage('revenueItems'))
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [user, authLoading])

  const generateAllTransactionsUpToDate = async (targetDate: Date): Promise<Transaction[]> => {
    const transactions: Transaction[] = []

    // Process subscriptions with optimized date calculation
    for (const sub of subscriptionItems) {
      if (!sub.accountId || !sub.repetitionDate) continue

      const repetitionDate = new Date(sub.repetitionDate)
      if (repetitionDate > targetDate) continue // Skip if subscription hasn't started yet

      const currentDate = new Date(repetitionDate)

      while (currentDate <= targetDate) {
        const transactionDateStr = currentDate.toISOString().split("T")[0]

        const usdAmount = await convertToUSD(sub.amount, sub.currency)

        transactions.push({
          id: `sub-${sub.id}-${transactionDateStr}`,
          type: "subscription",
          sourceId: sub.id,
          accountId: sub.accountId,
          amount: -usdAmount, // Negative for debit, in USD
          currency: "USD", // Store as USD for consistency
          date: transactionDateStr,
          description: `${sub.name} subscription`,
        })

        // Calculate next occurrence based on period
        if (sub.period === "monthly") {
          const originalDay = repetitionDate.getDate()
          currentDate.setMonth(currentDate.getMonth() + 1)
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
          if (originalDay > lastDayOfMonth) {
            currentDate.setDate(lastDayOfMonth)
          } else {
            currentDate.setDate(originalDay)
          }
        } else if (sub.period === "yearly") {
          currentDate.setFullYear(currentDate.getFullYear() + 1)
        }
      }
    }

    // Process revenue with optimized date calculation
    for (const rev of revenueItems) {
      if (!rev.accountId || !rev.repetitionDate) continue

      const repetitionDate = new Date(rev.repetitionDate)
      if (repetitionDate > targetDate) continue // Skip if revenue hasn't started yet

      if (rev.period === "once") {
        // One-time revenue, only add if the date matches exactly
        if (repetitionDate <= targetDate) {
          const transactionDateStr = repetitionDate.toISOString().split("T")[0]
          const usdAmount = await convertToUSD(rev.amount, rev.currency)

          transactions.push({
            id: `rev-${rev.id}-${transactionDateStr}`,
            type: "revenue",
            sourceId: rev.id,
            accountId: rev.accountId,
            amount: usdAmount, // Positive for credit, in USD
            currency: "USD", // Store as USD for consistency
            date: transactionDateStr,
            description: `${rev.name} income`,
          })
        }
        continue
      }

      const currentDate = new Date(repetitionDate)

      while (currentDate <= targetDate) {
        const transactionDateStr = currentDate.toISOString().split("T")[0]

        const usdAmount = await convertToUSD(rev.amount, rev.currency)

        transactions.push({
          id: `rev-${rev.id}-${transactionDateStr}`,
          type: "revenue",
          sourceId: rev.id,
          accountId: rev.accountId,
          amount: usdAmount, // Positive for credit, in USD
          currency: "USD", // Store as USD for consistency
          date: transactionDateStr,
          description: `${rev.name} income`,
        })

        // Calculate next occurrence based on period
        if (rev.period === "monthly") {
          const originalDay = repetitionDate.getDate()
          currentDate.setMonth(currentDate.getMonth() + 1)
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
          if (originalDay > lastDayOfMonth) {
            currentDate.setDate(lastDayOfMonth)
          } else {
            currentDate.setDate(originalDay)
          }
        } else if (rev.period === "yearly") {
          currentDate.setFullYear(currentDate.getFullYear() + 1)
        }
      }
    }

    // Sort transactions by date for consistent processing
    return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const calculateBalanceForAccount = async (accountId: string, targetDate: Date): Promise<number> => {
    // Get the base amount for the account
    const account = financeItems.find(item => item.id === accountId)
    if (!account) return 0
    
    // Convert base amount to USD
    let balance = await convertToUSD(account.amount, account.currency)
    
    // Get all transactions for this account up to the target date
    const allTransactions = await generateAllTransactionsUpToDate(targetDate)
    const accountTransactions = allTransactions.filter(t => t.accountId === accountId)
    
    // Apply all transactions to the balance
    accountTransactions.forEach(transaction => {
      balance += transaction.amount
    })
    
    return balance
  }

  const calculateBalanceAtDate = async (targetDate: Date): Promise<{ [accountId: string]: number }> => {
    const balances: { [accountId: string]: number } = {}

    // Calculate balance for each finance account
    for (const item of financeItems) {
      balances[item.id] = await calculateBalanceForAccount(item.id, targetDate)
    }

    return balances
  }

  const updateBalances = async () => {
    setIsLoadingBalances(true)
    try {
      const balances = await calculateBalanceAtDate(selectedDate)
      const total = Object.values(balances).reduce((sum, balance) => sum + balance, 0)
      setTotalBalanceUSD(total)

      // Create updated finance items with calculated balances
      const updatedFinanceItems = await Promise.all(
        financeItems.map(async (item) => {
          const calculatedBalance = await calculateBalanceForAccount(item.id, selectedDate)
          return {
            ...item,
            calculatedAmount: calculatedBalance, // Add calculated amount property
          };
        })
      );
      
      setDateAwareFinanceItems(updatedFinanceItems as FinanceItem[]);

      // Calculate monthly subscription total in USD
      let monthlySubsUSD = 0
      for (const item of subscriptionItems) {
        const usdAmount = await convertToUSD(item.amount, item.currency)
        const monthlyAmount = item.period === "yearly" ? usdAmount / 12 : usdAmount
        monthlySubsUSD += monthlyAmount
      }
      setMonthlySubscriptionsUSD(monthlySubsUSD)

      // Calculate monthly revenue total in USD
      let monthlyRevUSD = 0
      for (const item of revenueItems) {
        const usdAmount = await convertToUSD(item.amount, item.currency)
        if (item.period === "once") {
          monthlyRevUSD += usdAmount
        } else {
          const monthlyAmount = item.period === "yearly" ? usdAmount / 12 : usdAmount
          monthlyRevUSD += monthlyAmount
        }
      }
      setMonthlyRevenueUSD(monthlyRevUSD)
    } catch (error) {
      console.error("Error updating balances:", error)
    } finally {
      setIsLoadingBalances(false)
    }
  }

  useEffect(() => {
    updateBalances()
  }, [financeItems, subscriptionItems, revenueItems, selectedDate])

  const getDateAwareBalances = async () => {
    return await calculateBalanceAtDate(selectedDate)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAddFinance = async (newItem: Omit<FinanceItem, "id"> | FinanceItem) => {
    try {
      if ("id" in newItem) {
        // Editing existing item
        if (user) {
          const updatedItem = await financeItemsService.update(newItem.id, {
            name: newItem.name,
            amount: Number(newItem.amount),
            currency: newItem.currency
          })
          setFinanceItems(prev => prev.map(item => item.id === newItem.id ? updatedItem : item))
        } else {
          // Fallback to localStorage for non-authenticated users
          const updatedItems = financeItems.map(item => item.id === newItem.id ? newItem : item)
          setFinanceItems(updatedItems)
          saveToLocalStorage("financeItems", updatedItems)
        }
      } else {
        // Adding new item
        if (user) {
          const createdItem = await financeItemsService.create({
            name: newItem.name,
            amount: Number(newItem.amount),
            currency: newItem.currency
          })
          setFinanceItems(prev => [...prev, createdItem])
        } else {
          // Fallback to localStorage for non-authenticated users
          const financeItem: FinanceItem = {
            ...newItem,
            id: `finance-${Date.now()}`,
            amount: Number(newItem.amount)
          }
          const updatedItems = [...financeItems, financeItem]
          setFinanceItems(updatedItems)
          saveToLocalStorage("financeItems", updatedItems)
        }
      }
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving finance item:', error)
      // Could add toast notification here
    }
  }

  const handleAddSubscription = async (item: Omit<SubscriptionItem, "id"> | SubscriptionItem) => {
    try {
      if ("id" in item) {
        // Editing existing item
        if (user) {
          const updatedItem = await subscriptionItemsService.update(item.id, item)
          setSubscriptionItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
        } else {
          // Fallback to localStorage for non-authenticated users
          const updatedItems = subscriptionItems.map(i => i.id === item.id ? item : i)
          setSubscriptionItems(updatedItems)
          saveToLocalStorage("subscriptionItems", updatedItems)
        }
      } else {
        // Adding new item
        if (user) {
          const createdItem = await subscriptionItemsService.create(item)
          setSubscriptionItems(prev => [...prev, createdItem])
        } else {
          // Fallback to localStorage for non-authenticated users
          const newItem = { ...item, id: Date.now().toString() }
          const updatedItems = [...subscriptionItems, newItem]
          setSubscriptionItems(updatedItems)
          saveToLocalStorage("subscriptionItems", updatedItems)
        }
      }
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving subscription item:', error)
    }
  }

  const handleAddRevenue = async (item: Omit<RevenueItem, "id"> | RevenueItem) => {
    try {
      if ("id" in item) {
        // Editing existing item
        if (user) {
          const updatedItem = await revenueItemsService.update(item.id, item)
          setRevenueItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
        } else {
          // Fallback to localStorage for non-authenticated users
          const updatedItems = revenueItems.map(i => i.id === item.id ? item : i)
          setRevenueItems(updatedItems)
          saveToLocalStorage("revenueItems", updatedItems)
        }
      } else {
        // Adding new item
        if (user) {
          const createdItem = await revenueItemsService.create(item)
          setRevenueItems(prev => [...prev, createdItem])
        } else {
          // Fallback to localStorage for non-authenticated users
          const newItem = { ...item, id: Date.now().toString() }
          const updatedItems = [...revenueItems, newItem]
          setRevenueItems(updatedItems)
          saveToLocalStorage("revenueItems", updatedItems)
        }
      }
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving revenue item:', error)
    }
  }

  const handleEditFinance = async (item: Omit<FinanceItem, "id"> | FinanceItem) => {
    // Ensure we have an id for editing
    const fullItem = item as FinanceItem
    if (!fullItem.id) {
      console.error('Cannot edit item without id')
      return
    }

    try {
      if (user) {
        const updatedItem = await financeItemsService.update(fullItem.id, fullItem)
        setFinanceItems(prev => prev.map(i => i.id === fullItem.id ? updatedItem : i))
      } else {
        // Fallback to localStorage for non-authenticated users
        const updatedItems = financeItems.map(i => i.id === fullItem.id ? fullItem : i)
        setFinanceItems(updatedItems)
        saveToLocalStorage("financeItems", updatedItems)
      }
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating finance item:', error)
    }
  }

  const handleEditSubscription = async (item: Omit<SubscriptionItem, "id"> | SubscriptionItem) => {
    // Ensure we have an id for editing
    const fullItem = item as SubscriptionItem
    if (!fullItem.id) {
      console.error('Cannot edit item without id')
      return
    }

    try {
      if (user) {
        const updatedItem = await subscriptionItemsService.update(fullItem.id, fullItem)
        setSubscriptionItems(prev => prev.map(i => i.id === fullItem.id ? updatedItem : i))
      } else {
        // Fallback to localStorage for non-authenticated users
        const updatedItems = subscriptionItems.map(i => i.id === fullItem.id ? fullItem : i)
        setSubscriptionItems(updatedItems)
        saveToLocalStorage("subscriptionItems", updatedItems)
      }
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating subscription item:', error)
    }
  }

  const handleEditRevenue = async (item: Omit<RevenueItem, "id"> | RevenueItem) => {
    // Ensure we have an id for editing
    const fullItem = item as RevenueItem
    if (!fullItem.id) {
      console.error('Cannot edit item without id')
      return
    }

    try {
      if (user) {
        const updatedItem = await revenueItemsService.update(fullItem.id, fullItem)
        setRevenueItems(prev => prev.map(i => i.id === fullItem.id ? updatedItem : i))
      } else {
        // Fallback to localStorage for non-authenticated users
        const updatedItems = revenueItems.map(i => i.id === fullItem.id ? fullItem : i)
        setRevenueItems(updatedItems)
        saveToLocalStorage("revenueItems", updatedItems)
      }
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error updating revenue item:', error)
    }
  }

  const handleItemClick = (item: FinanceItem | SubscriptionItem | RevenueItem) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  const getCurrentItems = () => {
    switch (activeTab) {
      case "finance":
        return dateAwareFinanceItems // Use state instead of async function
      case "subscriptions":
        return subscriptionItems
      case "revenue":
        return revenueItems
      default:
        return []
    }
  }

  const getMonthlyTotal = () => {
    switch (activeTab) {
      case "subscriptions":
        return monthlySubscriptionsUSD
      case "revenue":
        return monthlyRevenueUSD
      default:
        return 0
    }
  }

  const getDeleteHandler = () => {
    switch (activeTab) {
      case "finance":
        return handleDeleteFinance
      case "subscriptions":
        return handleDeleteSubscription
      case "revenue":
        return handleDeleteRevenue
      default:
        return () => {}
    }
  }

  const handleDeleteFinance = async (id: string) => {
    if (user) {
      try {
        await financeItemsService.delete(id)
        setFinanceItems((prev) => prev.filter((item) => item.id !== id))
      } catch (error) {
        console.error('Error deleting finance item:', error)
        // Fallback to localStorage
        const updatedItems = financeItems.filter((item) => item.id !== id)
        setFinanceItems(updatedItems)
        saveToLocalStorage("financeItems", updatedItems)
      }
    } else {
      const updatedItems = financeItems.filter((item) => item.id !== id)
      setFinanceItems(updatedItems)
      saveToLocalStorage("financeItems", updatedItems)
    }
  }

  const handleDeleteSubscription = async (id: string) => {
    if (user) {
      try {
        await subscriptionItemsService.delete(id)
        setSubscriptionItems((prev) => prev.filter((item) => item.id !== id))
      } catch (error) {
        console.error('Error deleting subscription item:', error)
        // Fallback to localStorage
        const updatedItems = subscriptionItems.filter((item) => item.id !== id)
        setSubscriptionItems(updatedItems)
        saveToLocalStorage("subscriptionItems", updatedItems)
      }
    } else {
      const updatedItems = subscriptionItems.filter((item) => item.id !== id)
      setSubscriptionItems(updatedItems)
      saveToLocalStorage("subscriptionItems", updatedItems)
    }
  }

  const handleDeleteRevenue = async (id: string) => {
    if (user) {
      try {
        await revenueItemsService.delete(id)
        setRevenueItems((prev) => prev.filter((item) => item.id !== id))
      } catch (error) {
        console.error('Error deleting revenue item:', error)
        // Fallback to localStorage
        const updatedItems = revenueItems.filter((item) => item.id !== id)
        setRevenueItems(updatedItems)
        saveToLocalStorage("revenueItems", updatedItems)
      }
    } else {
      const updatedItems = revenueItems.filter((item) => item.id !== id)
      setRevenueItems(updatedItems)
      saveToLocalStorage("revenueItems", updatedItems)
    }
  }

  const getTransactionHistory = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    const allTransactions = await generateAllTransactionsUpToDate(endDate)
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    return allTransactions.filter((transaction) => transaction.date >= startDateStr && transaction.date <= endDateStr)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: "url(/gradient-background.svg)",
            backgroundSize: "200% 150%",
            backgroundPosition: "center 85%",
            backgroundRepeat: "no-repeat",
            filter: "blur(2px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-8 pb-24">
        <Header
          totalBalance={totalBalanceUSD}
          activeTab={activeTab}
          monthlySubscriptions={monthlySubscriptionsUSD}
          monthlyRevenue={monthlyRevenueUSD}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          isLoading={isLoadingBalances}
        />

        <div className="mt-8">
          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="mt-6">
          <ItemsList
            items={getCurrentItems()}
            activeTab={activeTab}
            monthlyTotal={getMonthlyTotal()}
            onItemClick={handleItemClick}
            onItemDelete={getDeleteHandler()}
            selectedDate={selectedDate}
          />
        </div>

        <AddNewButton onClick={() => setShowModal(true)} />

        {showModal && activeTab === "finance" && (
          <AddFinanceModal
            onSave={editingItem ? handleEditFinance : handleAddFinance}
            onClose={handleModalClose}
            editingItem={editingItem as FinanceItem | null}
            onDelete={handleDeleteFinance}
          />
        )}

        {showModal && activeTab === "subscriptions" && (
          <AddSubscriptionModal
            onSave={editingItem ? handleEditSubscription : handleAddSubscription}
            onClose={handleModalClose}
            editingItem={editingItem as SubscriptionItem | null}
            financeAccounts={financeItems}
            onDelete={handleDeleteSubscription}
          />
        )}

        {showModal && activeTab === "revenue" && (
          <AddRevenueModal
            onSave={editingItem ? handleEditRevenue : handleAddRevenue}
            onClose={handleModalClose}
            editingItem={editingItem as RevenueItem | null}
            financeItems={financeItems}
            onDelete={handleDeleteRevenue}
          />
        )}
      </div>
    </div>
  )
}
