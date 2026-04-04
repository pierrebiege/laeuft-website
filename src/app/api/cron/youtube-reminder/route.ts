import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

const SETTING_LABELS: Record<string, string> = {
  keller: 'Im Keller (Talk-to-Camera)',
  outdoor: 'Outdoor (Lauf-Footage / unterwegs)',
  challenge: 'Challenge (ganzer Tag / spezielle Location)',
  collab: 'Collab (mit Partner koordinieren!)',
  race: 'Race Day (Filmteam / GoPro)',
}

const SETTING_EMOJI: Record<string, string> = {
  keller: '🏠',
  outdoor: '🏔️',
  challenge: '🎯',
  collab: '🤝',
  race: '🏁',
}

function getCurrentWeek(): string {
  const now = new Date()
  const start = new Date(2026, 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const weekNum = Math.ceil((diff / oneWeek + start.getDay()) / 1)
  return `W${weekNum}`
}

export async function POST(request: NextRequest) {
  // Cron security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentWeek = getCurrentWeek()

  // Fetch this week's videos
  const { data: thisWeek, error: thisError } = await supabaseAdmin
    .from('youtube_videos')
    .select('*')
    .eq('week', currentWeek)
    .order('rating', { ascending: true })

  if (thisError) {
    return NextResponse.json({ error: thisError.message }, { status: 500 })
  }

  // Fetch next week's videos for preview
  const nextWeekNum = parseInt(currentWeek.replace('W', '')) + 1
  const nextWeek = `W${nextWeekNum}`

  const { data: nextWeekVideos } = await supabaseAdmin
    .from('youtube_videos')
    .select('*')
    .eq('week', nextWeek)
    .order('rating', { ascending: true })

  // Count overall stats
  const { data: allVideos } = await supabaseAdmin
    .from('youtube_videos')
    .select('status')

  const stats = {
    total: allVideos?.length || 0,
    open: allVideos?.filter(v => v.status === 'open').length || 0,
    scripted: allVideos?.filter(v => v.status === 'scripted').length || 0,
    filmed: allVideos?.filter(v => v.status === 'filmed').length || 0,
    edited: allVideos?.filter(v => v.status === 'edited').length || 0,
    published: allVideos?.filter(v => v.status === 'published').length || 0,
  }

  if (!thisWeek || thisWeek.length === 0) {
    return NextResponse.json({ ok: true, message: 'No videos this week' })
  }

  // Build email
  const videoRows = thisWeek.map(v => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e7;">
        <div style="font-weight: 600; color: #18181b; margin-bottom: 4px;">${v.title}</div>
        <div style="font-size: 13px; color: #71717a;">${v.description || ''}</div>
        <div style="margin-top: 8px; display: flex; gap: 6px;">
          <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${v.rating === 'S' ? '#fbbf24' : '#dbeafe'}; color: ${v.rating === 'S' ? '#000' : '#1d4ed8'}; font-weight: 600;">${v.rating === 'S' ? 'Pflicht' : 'Stark'}</span>
          <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f4f4f5; color: #52525b;">${SETTING_EMOJI[v.setting] || ''} ${SETTING_LABELS[v.setting] || v.setting}</span>
          ${v.formula ? `<span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f3e8ff; color: #7c3aed;">${v.formula}</span>` : ''}
          <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${v.status === 'open' ? '#f4f4f5' : v.status === 'published' ? '#dcfce7' : '#fef3c7'}; color: ${v.status === 'open' ? '#71717a' : v.status === 'published' ? '#16a34a' : '#d97706'};">${v.status}</span>
        </div>
      </td>
    </tr>
  `).join('')

  const nextWeekPreview = (nextWeekVideos || []).map(v =>
    `<li style="margin-bottom: 4px; color: #52525b;">${v.title} <span style="color: #a1a1aa;">(${SETTING_EMOJI[v.setting] || ''} ${v.setting})</span></li>`
  ).join('')

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #18181b; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="margin-bottom: 24px;">
    <h1 style="font-size: 22px; font-weight: bold; margin: 0;">YouTube Masterplan – ${currentWeek}</h1>
    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Diese Woche stehen ${thisWeek.length} Videos an</p>
  </div>

  <div style="display: flex; gap: 8px; margin-bottom: 24px;">
    <div style="background: #f4f4f5; border-radius: 8px; padding: 10px 16px; text-align: center;">
      <div style="font-size: 20px; font-weight: bold; color: #16a34a;">${stats.published}</div>
      <div style="font-size: 11px; color: #71717a;">Published</div>
    </div>
    <div style="background: #f4f4f5; border-radius: 8px; padding: 10px 16px; text-align: center;">
      <div style="font-size: 20px; font-weight: bold;">${stats.total}</div>
      <div style="font-size: 11px; color: #71717a;">Total</div>
    </div>
    <div style="background: #f4f4f5; border-radius: 8px; padding: 10px 16px; text-align: center;">
      <div style="font-size: 20px; font-weight: bold; color: #d97706;">${stats.open}</div>
      <div style="font-size: 11px; color: #71717a;">Offen</div>
    </div>
  </div>

  <h2 style="font-size: 16px; margin-bottom: 12px;">📹 Diese Woche</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #fafafa; border-radius: 8px;">
    ${videoRows}
  </table>

  ${nextWeekPreview ? `
  <h2 style="font-size: 16px; margin-bottom: 8px;">👀 Nächste Woche (${nextWeek})</h2>
  <ul style="font-size: 14px; padding-left: 20px; margin-bottom: 24px;">
    ${nextWeekPreview}
  </ul>
  ` : ''}

  <div style="text-align: center; margin: 24px 0;">
    <a href="https://laeuft.ch/admin/youtube" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
      Masterplan öffnen
    </a>
  </div>

  <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
    Ziel: 30.000 Abonnenten bis 31.12.2026
  </p>

</body>
</html>`

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"Läuft YouTube" <${process.env.SMTP_USER || 'pierre@laeuft.ch'}>`,
    to: 'pierre@laeuft.ch',
    subject: `YouTube ${currentWeek}: ${thisWeek.map(v => v.title).join(' + ')}`,
    html: emailHtml,
  })

  return NextResponse.json({
    ok: true,
    week: currentWeek,
    videos: thisWeek.length,
    message: `Reminder sent for ${currentWeek}`,
  })
}
