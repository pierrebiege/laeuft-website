import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

// GET: Register webhook with Telegram
// Call once after deploy: /api/telegram/setup
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const webhookUrl = `${new URL(request.url).origin}/api/telegram/webhook`
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
  )
  const data = await res.json()
  return NextResponse.json(data)
}
