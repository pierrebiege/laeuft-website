// WhatsApp Cloud API helper
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'

export async function sendWhatsAppMessage(phone: string, message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp not configured')
    return null
  }

  // Format phone: remove spaces, +, etc. Ensure starts with country code
  const formattedPhone = phone.replace(/[\s+\-()]/g, '')

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: message }
    })
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('WhatsApp send error:', data)
    return null
  }
  return data
}
