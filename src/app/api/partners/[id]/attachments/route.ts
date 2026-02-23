import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/partners/[id]/attachments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('partner_attachments')
    .select('*')
    .eq('partner_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Generate signed URLs for each attachment
  const attachments = await Promise.all(
    (data || []).map(async (att) => {
      const { data: urlData } = await supabase.storage
        .from('partner-attachments')
        .createSignedUrl(att.file_path, 3600) // 1 hour

      return { ...att, url: urlData?.signedUrl || null }
    })
  )

  return NextResponse.json(attachments)
}

// POST /api/partners/[id]/attachments - Upload file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File
  const uploadedBy = (formData.get('uploaded_by') as string) || 'Unknown'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const filePath = `${id}/${Date.now()}_${file.name}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('partner-attachments')
    .upload(filePath, file)

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Save metadata
  const { data, error } = await supabase
    .from('partner_attachments')
    .insert({
      partner_id: id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// DELETE /api/partners/[id]/attachments
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { attachment_id, file_path } = await request.json()

  // Delete from storage
  if (file_path) {
    await supabase.storage
      .from('partner-attachments')
      .remove([file_path])
  }

  // Delete metadata
  const { error } = await supabase
    .from('partner_attachments')
    .delete()
    .eq('id', attachment_id)
    .eq('partner_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
