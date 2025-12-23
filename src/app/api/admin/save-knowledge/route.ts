import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

const KNOWLEDGE_FILE = path.join(process.cwd(), 'src/data/knowledge.json');

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

    // Define storage path: public/data/knowledge/{archetype}/{region}/{category}/
    const targetDir = path.join(process.cwd(), 'public', 'data', 'knowledge', archetypeId, regionId, categoryId);
    await fs.mkdir(targetDir, { recursive: true });

    // Save File
    // We save two things: The original PDF (for reference) and the parsed text (for RAG)
    // Actually for RAG we might just want to save a JSON or Text file. 
    // Let's save the original PDF and a companion JSON file with metadata + extracted text.
    
    const fileName = file.name;
    const baseName = path.parse(fileName).name;
    const jsonFileName = `${baseName}.json`;

    const pdfPath = path.join(targetDir, fileName);
    const jsonPath = path.join(targetDir, jsonFileName);

    await fs.writeFile(pdfPath, buffer);

    const knowledgeEntry = {
        id: crypto.randomUUID(),
        title: baseName,
        fileName: fileName,
        content: text,
        uploadedAt: new Date().toISOString(),
        metadata: { archetypeId, regionId, categoryId }
    };

    await fs.writeFile(jsonPath, JSON.stringify(knowledgeEntry, null, 2));

    return NextResponse.json({ success: true, entry: knowledgeEntry });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
    // Recursive function to scan directories
    const rootDir = path.join(process.cwd(), 'public', 'data', 'knowledge');
    
    async function getFiles(dir: string): Promise<any[]> {
        let results: any[] = [];
        try {
            const list = await fs.readdir(dir, { withFileTypes: true });
            for (const dirent of list) {
                const res = path.resolve(dir, dirent.name);
                if (dirent.isDirectory()) {
                    results = results.concat(await getFiles(res));
                } else {
                    if (res.endsWith('.json')) {
                        const content = await fs.readFile(res, 'utf-8');
                        try {
                            const json = JSON.parse(content);
                            // Return lightweight version
                            results.push({
                                id: json.id,
                                title: json.title,
                                uploadedAt: json.uploadedAt,
                                contentLength: json.content?.length || 0,
                                metadata: json.metadata || {}
                            });
                        } catch (e) {
                            // ignore bad json
                        }
                    }
                }
            }
        } catch (e) {
            // dir might not exist yet
        }
        return results;
    }

    const allItems = await getFiles(rootDir);
    return NextResponse.json(allItems);
}
