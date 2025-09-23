export interface ExchangeRate {
  cc: string
  rate: number
  exchangedate: string
}

export interface ExchangeRateCache {
  [currency: string]: {
    rate: number
    timestamp: number
    date: string
  }
}

// Cache exchange rates for 1 hour
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

const exchangeRateCache: ExchangeRateCache = {}

export async function fetchExchangeRate(currency: string): Promise<number> {
  // USD is base currency, no conversion needed
  if (currency === "USD") return 1

  // UAH is the base currency for NBU API, so UAH to UAH rate is 1
  if (currency === "UAH") return 1

  const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
  const cacheKey = `${currency}_${today}`

  // Check cache first
  const cached = exchangeRateCache[cacheKey]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate
  }

  try {
    const response = await fetch(`/api/nbu-rate?valcode=${currency}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Cache the result
    exchangeRateCache[cacheKey] = {
      rate: data.rate,
      timestamp: Date.now(),
      date: data.exchangedate,
    }

    return data.rate
  } catch (error) {
    console.error(`Error fetching exchange rate for ${currency}:`, error)

    // Return cached rate if available, even if expired
    if (cached) {
      return cached.rate
    }

    // Fallback rates if API is unavailable - using fixed rates
    const fallbackRates: { [key: string]: number } = {
      EUR: 40, // Fixed rate for EUR
      UAH: 1,
    }

    return fallbackRates[currency] || 1
  }
}

export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === "USD") return amount

  try {
    // Special case for UAH - it's the base currency for NBU API
    if (fromCurrency === "UAH") {
      // Get USD to UAH rate to convert UAH to USD
      const usdToUahResponse = await fetch(`/api/nbu-rate?valcode=USD`)
      if (!usdToUahResponse.ok) throw new Error("Failed to fetch USD rate")
      
      const usdToUahData = await usdToUahResponse.json()
      if (usdToUahData.error) throw new Error(usdToUahData.error)
      
      // Convert UAH to USD: UAH amount / USD rate (how many UAH per 1 USD)
      return amount / usdToUahData.rate
    }

    // For other currencies, get their rate to UAH first
    const foreignToUahResponse = await fetch(`/api/nbu-rate?valcode=${fromCurrency}`)
    if (!foreignToUahResponse.ok) throw new Error(`Failed to fetch ${fromCurrency} rate`)
    
    const foreignToUahData = await foreignToUahResponse.json()
    if (foreignToUahData.error) throw new Error(foreignToUahData.error)
    
    // Then get USD to UAH rate
    const usdToUahResponse = await fetch(`/api/nbu-rate?valcode=USD`)
    if (!usdToUahResponse.ok) throw new Error("Failed to fetch USD rate")
    
    const usdToUahData = await usdToUahResponse.json()
    if (usdToUahData.error) throw new Error(usdToUahData.error)
    
    // Convert: foreign → UAH → USD
    // First convert to UAH, then divide by USD rate to get USD amount
    const amountInUah = amount * foreignToUahData.rate
    return amountInUah / usdToUahData.rate
  } catch (error) {
    console.error(`Error converting ${fromCurrency} to USD:`, error)
    
    // Fallback rates if API fails
    if (fromCurrency === "UAH") return amount / 40 // Approximate UAH/USD rate
    if (fromCurrency === "EUR") return amount * 1.18 // Approximate EUR to USD rate
    return amount // Default fallback
  }
}

export function formatAmountInUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
