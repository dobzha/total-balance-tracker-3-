"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchExchangeRate, convertToUSD } from "@/lib/exchange-rates"

export interface CurrencyConversion {
  originalAmount: number
  originalCurrency: string
  usdAmount: number
  rate: number
  loading: boolean
  error: string | null
}

export function useExchangeRate(currency: string) {
  const [rate, setRate] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRate = useCallback(async () => {
    if (currency === "USD") {
      setRate(1)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fetchedRate = await fetchExchangeRate(currency)
      setRate(fetchedRate)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch exchange rate")
    } finally {
      setLoading(false)
    }
  }, [currency])

  useEffect(() => {
    fetchRate()
  }, [fetchRate])

  return { rate, loading, error, refetch: fetchRate }
}

export function useCurrencyConversion(amount: number, fromCurrency: string): CurrencyConversion {
  const [conversion, setConversion] = useState<CurrencyConversion>({
    originalAmount: amount,
    originalCurrency: fromCurrency,
    usdAmount: amount,
    rate: 1,
    loading: false,
    error: null,
  })

  useEffect(() => {
    const convertAmount = async () => {
      if (fromCurrency === "USD") {
        setConversion({
          originalAmount: amount,
          originalCurrency: fromCurrency,
          usdAmount: amount,
          rate: 1,
          loading: false,
          error: null,
        })
        return
      }

      setConversion((prev) => ({ ...prev, loading: true, error: null }))

      try {
        // Always use the NBU exchange rate API for all currencies
        let usdAmount = await convertToUSD(amount, fromCurrency)
        let rate = await fetchExchangeRate(fromCurrency)

        setConversion({
          originalAmount: amount,
          originalCurrency: fromCurrency,
          usdAmount,
          rate,
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error("Error converting currency:", err)
        
        // Fallback to direct conversion using approximate rates
        let usdAmount = amount;
        let rate = 1;
        
        if (fromCurrency === "EUR") {
          rate = 1.18;
          usdAmount = amount * rate; // Approximate EUR to USD rate
        } else if (fromCurrency === "UAH") {
          rate = 0.025; // Corrected rate (1/40)
          usdAmount = amount * rate; // Approximate UAH to USD rate
        }
        
        setConversion({
          originalAmount: amount,
          originalCurrency: fromCurrency,
          usdAmount,
          rate,
          loading: false,
          error: "Failed to convert currency"
        })
      }
    }

    convertAmount()
  }, [amount, fromCurrency])

  return conversion
}

export function useMultiCurrencyConversion(items: Array<{ amount: number; currency: string }>) {
  const [totalUSD, setTotalUSD] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const convertAll = async () => {
      if (items.length === 0) {
        setTotalUSD(0)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const conversions = await Promise.all(items.map((item) => convertToUSD(item.amount, item.currency)))

        const total = conversions.reduce((sum, amount) => sum + amount, 0)
        setTotalUSD(total)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to convert currencies")
      } finally {
        setLoading(false)
      }
    }

    convertAll()
  }, [items])

  return { totalUSD, loading, error }
}
