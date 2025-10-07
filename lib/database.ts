import { supabase } from './supabase'
import type { FinanceItem, SubscriptionItem, RevenueItem } from '@/app/page'

// Database types (matching our Supabase schema)
export interface DbFinanceItem {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  created_at: string
  updated_at: string
}

export interface DbSubscriptionItem {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  period: 'monthly' | 'yearly'
  repetition_date: string
  account_id: string | null
  created_at: string
  updated_at: string
}

export interface DbRevenueItem {
  id: string
  user_id: string
  name: string
  amount: number
  currency: string
  period: 'monthly' | 'yearly' | 'once'
  repetition_date: string | null
  account_id: string | null
  created_at: string
  updated_at: string
}

// Helper functions to convert between app types and database types
const dbToFinanceItem = (dbItem: DbFinanceItem): FinanceItem => ({
  id: dbItem.id,
  name: dbItem.name,
  amount: dbItem.amount,
  currency: dbItem.currency,
})

const financeItemToDb = (item: Omit<FinanceItem, 'id'>, userId: string): Omit<DbFinanceItem, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  name: item.name,
  amount: item.amount,
  currency: item.currency,
})

const dbToSubscriptionItem = (dbItem: DbSubscriptionItem): SubscriptionItem => ({
  id: dbItem.id,
  name: dbItem.name,
  amount: dbItem.amount,
  currency: dbItem.currency,
  period: dbItem.period,
  repetitionDate: dbItem.repetition_date,
  accountId: dbItem.account_id || undefined,
})

const subscriptionItemToDb = (item: Omit<SubscriptionItem, 'id'>, userId: string): Omit<DbSubscriptionItem, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  name: item.name,
  amount: item.amount,
  currency: item.currency,
  period: item.period,
  repetition_date: item.repetitionDate,
  account_id: item.accountId || null,
})

const dbToRevenueItem = (dbItem: DbRevenueItem): RevenueItem => ({
  id: dbItem.id,
  name: dbItem.name,
  amount: dbItem.amount,
  currency: dbItem.currency,
  period: dbItem.period,
  repetitionDate: dbItem.repetition_date || undefined,
  accountId: dbItem.account_id || undefined,
})

const revenueItemToDb = (item: Omit<RevenueItem, 'id'>, userId: string): Omit<DbRevenueItem, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  name: item.name,
  amount: item.amount,
  currency: item.currency,
  period: item.period,
  repetition_date: item.repetitionDate || null,
  account_id: item.accountId || null,
})

// Finance Items Operations
export const financeItemsService = {
  async getAll(): Promise<FinanceItem[]> {
    const { data, error } = await supabase
      .from('finance_items')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching finance items:', error)
      throw error
    }

    return data.map(dbToFinanceItem)
  },

  async create(item: Omit<FinanceItem, 'id'>): Promise<FinanceItem> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('finance_items')
      .insert(financeItemToDb(item, user.id))
      .select()
      .single()

    if (error) {
      console.error('Error creating finance item:', error)
      throw error
    }

    return dbToFinanceItem(data)
  },

  async update(id: string, item: Partial<Omit<FinanceItem, 'id'>>): Promise<FinanceItem> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: any = {}
    if (item.name !== undefined) updateData.name = item.name
    if (item.amount !== undefined) updateData.amount = item.amount
    if (item.currency !== undefined) updateData.currency = item.currency
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('finance_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating finance item:', error)
      throw error
    }

    return dbToFinanceItem(data)
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('finance_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting finance item:', error)
      throw error
    }
  }
}

// Subscription Items Operations
export const subscriptionItemsService = {
  async getAll(): Promise<SubscriptionItem[]> {
    const { data, error } = await supabase
      .from('subscription_items')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching subscription items:', error)
      throw error
    }

    return data.map(dbToSubscriptionItem)
  },

  async create(item: Omit<SubscriptionItem, 'id'>): Promise<SubscriptionItem> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('subscription_items')
      .insert(subscriptionItemToDb(item, user.id))
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription item:', error)
      throw error
    }

    return dbToSubscriptionItem(data)
  },

  async update(id: string, item: Partial<Omit<SubscriptionItem, 'id'>>): Promise<SubscriptionItem> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: any = {}
    if (item.name !== undefined) updateData.name = item.name
    if (item.amount !== undefined) updateData.amount = item.amount
    if (item.currency !== undefined) updateData.currency = item.currency
    if (item.period !== undefined) updateData.period = item.period
    if (item.repetitionDate !== undefined) updateData.repetition_date = item.repetitionDate
    if (item.accountId !== undefined) updateData.account_id = item.accountId || null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('subscription_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription item:', error)
      throw error
    }

    return dbToSubscriptionItem(data)
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('subscription_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting subscription item:', error)
      throw error
    }
  }
}

// Revenue Items Operations
export const revenueItemsService = {
  async getAll(): Promise<RevenueItem[]> {
    const { data, error } = await supabase
      .from('revenue_items')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching revenue items:', error)
      throw error
    }

    return data.map(dbToRevenueItem)
  },

  async create(item: Omit<RevenueItem, 'id'>): Promise<RevenueItem> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('revenue_items')
      .insert(revenueItemToDb(item, user.id))
      .select()
      .single()

    if (error) {
      console.error('Error creating revenue item:', error)
      throw error
    }

    return dbToRevenueItem(data)
  },

  async update(id: string, item: Partial<Omit<RevenueItem, 'id'>>): Promise<RevenueItem> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: any = {}
    if (item.name !== undefined) updateData.name = item.name
    if (item.amount !== undefined) updateData.amount = item.amount
    if (item.currency !== undefined) updateData.currency = item.currency
    if (item.period !== undefined) updateData.period = item.period
    if (item.repetitionDate !== undefined) updateData.repetition_date = item.repetitionDate || null
    if (item.accountId !== undefined) updateData.account_id = item.accountId || null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('revenue_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating revenue item:', error)
      throw error
    }

    return dbToRevenueItem(data)
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('revenue_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting revenue item:', error)
      throw error
    }
  }
}

// Utility function to load all user data
export const loadAllUserData = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      financeItems: [],
      subscriptionItems: [],
      revenueItems: []
    }
  }

  try {
    const [financeItems, subscriptionItems, revenueItems] = await Promise.all([
      financeItemsService.getAll(),
      subscriptionItemsService.getAll(),
      revenueItemsService.getAll()
    ])

    return {
      financeItems,
      subscriptionItems,
      revenueItems
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    return {
      financeItems: [],
      subscriptionItems: [],
      revenueItems: []
    }
  }
}