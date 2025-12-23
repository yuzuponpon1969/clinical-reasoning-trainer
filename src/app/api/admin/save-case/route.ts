import { NextResponse } from 'next/server';
import { Case } from '@/lib/data';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newCase = body as Case;

        // Basic Validation
        if (!newCase.id || !newCase.title || !newCase.initialComplaint) {
            return NextResponse.json({ error: 'Invalid case data' }, { status: 400 });
        }

        // Determine Category Hierarchy for metadata columns
        const archetypeId = (body.archetypeId || newCase.archetypeId || 'unknown_archetype');
        const regionId = (body.regionId || newCase.regionId || 'unknown_region');
        const categoryId = (body.categoryId || newCase.categoryId || 'uncategorized');

        // Upsert to DB
        // We store the full object in 'content', but also extract key metadata to columns for filtering
        const { error } = await supabase
            .from('cases')
            .upsert({
                id: newCase.id,
                title: newCase.title,
                archetype_id: archetypeId,
                region_id: regionId,
                category_id: categoryId,
                content: newCase // JSONB column
            });

        if (error) throw error;

        return NextResponse.json({ success: true, id: newCase.id });

    } catch (error: any) {
        console.error("Error saving case:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
