import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "edge"

const querySchema = z.object({
  valcode: z
    .string()
    .length(3, "Currency code must be exactly 3 letters")
    .regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters"),
})

function getKyivDate(): string {
  const now = new Date()
  // Convert to Kyiv timezone (UTC+2/UTC+3 depending on DST)
  const kyivTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }))

  const year = kyivTime.getFullYear()
  const month = String(kyivTime.getMonth() + 1).padStart(2, "0")
  const day = String(kyivTime.getDate()).padStart(2, "0")

  return `${year}${month}${day}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const valcode = searchParams.get("valcode")

    // Validate input
    const validation = querySchema.safeParse({ valcode })
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const { valcode: validatedValcode } = validation.data
    const date = getKyivDate()

    // Call NBU API
    const nbuUrl = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${validatedValcode}&date=${date}&json`

    const response = await fetch(nbuUrl, {
      headers: {
        "User-Agent": "Total-Balance-Tracker/1.0",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "NBU unavailable" }, { status: 502 })
    }

    const data = await response.json()

    // Check if data is empty or invalid
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Currency not found or no data available" }, { status: 404 })
    }

    // Pick the first element and return required fields
    const rateData = data[0]
    const result = {
      cc: rateData.cc,
      rate: rateData.rate,
      exchangedate: rateData.exchangedate,
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("NBU API Error:", error)
    return NextResponse.json({ error: "NBU unavailable" }, { status: 502 })
  }
}
