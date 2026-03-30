import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { phone, message } = body

  if (!phone || !message) {
    return NextResponse.json(
      { error: 'phone und message sind erforderlich' },
      { status: 400 }
    )
  }

  const result = await sendWhatsAppMessage(phone, message)

  if (!result) {
    return NextResponse.json(
      { error: 'WhatsApp-Nachricht konnte nicht gesendet werden' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, result })
}
