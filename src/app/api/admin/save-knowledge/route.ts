import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { supabase } from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const archetypeId = formData.get('archetypeId') as string;
    const regionId = formData.get('regionId') as string;
    const categoryId = formData.get('categoryId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!archetypeId || !regionId || !categoryId) {
        return NextResponse.json({ error: 'Missing metadata (Archetype/Region/Category)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF
    const data = await pdf(buffer);
    const text = data.text;
    const fileName = file.name;
    const baseName = fileName.replace(/\.pdf$/i, '');

    // Upsert to DB
    const { error } = await supabase
        .from('knowledge_items')
        .upsert({
            id: crypto.randomUUID(),
            title: baseName,
            content: text,
            archetype_id: archetypeId,
            region_id: regionId,
            category_id: categoryId,
            content_length: text.length
        });
    
    if (error) throw error;

    return NextResponse.json({ success: true, title: baseName });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
    const { data, error } = await supabase
        .from('knowledge_items')
        .select('id, title, created_at, content_length, archetype_id, region_id, category_id')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json([], { status: 500 });
    }

    // Map to frontend expected format
    const items = data.map(item => ({
        id: item.id,
        title: item.title,
        uploadedAt: item.created_at,
        contentLength: item.content_length,
        metadata: {
            archetypeId: item.archetype_id,
            regionId: item.region_id,
            categoryId: item.category_id
        }
    }));

    return NextResponse.json(items);
}
