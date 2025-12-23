import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Case } from '@/lib/data';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newCase = body as Case;

        // Basic Validation
        if (!newCase.id || !newCase.title || !newCase.initialComplaint) {
            return NextResponse.json({ error: 'Invalid case data' }, { status: 400 });
        }

        // Determine Category Directory
        // Use hierarchy provided by UI override, or fallback to internal data
        const archetypeId = (body.archetypeId || newCase.archetypeId || 'unknown_archetype');
        const regionId = (body.regionId || newCase.regionId || 'unknown_region');
        const categoryId = (body.categoryId || newCase.categoryId || 'uncategorized');

        const targetDir = path.join(process.cwd(), 'public', 'data', 'cases', archetypeId, regionId, categoryId);
        await fs.mkdir(targetDir, { recursive: true });

        // Generate Filename
        // We use the ID as the filename to ensure uniqueness within the folder
        const fileName = `${newCase.id}.json`;
        const filePath = path.join(targetDir, fileName);
        
        // Check for duplicates in this specific folder
        // If file exists, we might overwrite or error. 
        // The user requirement says "Import Case... separate folders".
        // Let's safe-guard against accidental overwrite by appending timestamp if exists, 
        // or just overwrite if that's the intention. 
        // Given "Import" often implies adding new, let's just overwrite for now as it's easier to correct mistakes.
        
        await fs.writeFile(filePath, JSON.stringify(newCase, null, 2), 'utf-8');

        return NextResponse.json({ success: true, path: `/data/cases/${categoryId}/${fileName}` });

    } catch (error: any) {
        console.error("Error saving case:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
