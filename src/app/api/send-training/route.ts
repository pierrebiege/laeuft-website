import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { planId } = await request.json()

    // Get plan with client
    const { data: plan, error } = await supabaseAdmin
      .from('training_plans')
      .select('*, client:clients(*)')
      .eq('id', planId)
      .single()

    if (error || !plan) {
      return NextResponse.json({ error: 'Trainingsplan nicht gefunden' }, { status: 404 })
    }

    const client = plan.client
    const planUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://laeuft.ch'}/training/${plan.unique_token}`

    // Send email
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER}>`,
      to: client.email,
      bcc: process.env.SMTP_USER,
      subject: `Dein Trainingsplan: ${plan.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="margin-bottom: 30px;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0;">Läuft<span style="color: #999;">.</span></h1>
          </div>

          <p>Hallo ${client.name},</p>

          <p>Dein Trainingsplan <strong>${plan.title}</strong> ist bereit.</p>

          <p>Du findest dort alle Wochen und Sessions im Detail. Erledigte Einheiten kannst du direkt abhaken.</p>

          <a href="${planUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">
            Trainingsplan ansehen
          </a>

          <p style="color: #666; font-size: 14px; margin-top: 32px;">
            Bei Fragen melde dich jederzeit.<br><br>
            Beste Grüsse<br>
            Pierre
          </p>

          <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #999;">
            <p>
              Pierre Biege<br>
              pierre@laeuft.ch
            </p>
          </div>

        </body>
        </html>
      `,
      text: `
Hallo ${client.name},

Dein Trainingsplan ${plan.title} ist bereit.

Du findest dort alle Wochen und Sessions im Detail. Erledigte Einheiten kannst du direkt abhaken.

Trainingsplan ansehen: ${planUrl}

Bei Fragen melde dich jederzeit.

Beste Grüsse
Pierre
      `.trim(),
    })

    // Update plan status
    await supabaseAdmin
      .from('training_plans')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', planId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email error:', err)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }
}
