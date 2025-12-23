import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ARCHETYPES, BODY_REGIONS } from '@/lib/data';

const pdf = require('pdf-parse');

export async function POST(req: Request) {
    console.log("PDF Parsing API Called");

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error("No file provided");
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        
        console.log("File received:", file.name, file.size);

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF content
        console.log("Parsing PDF with pdf-parse...");
        
        const data = await pdf(buffer);
        const rawText = data.text;
        
        if (!rawText) { 
            throw new Error("Failed to extract text from PDF (empty result)");
        }

        console.log("PDF Parsed. Text length:", rawText.length);

        // Prepare constraints for prompt
        const archetypeIds = ARCHETYPES.map(a => a.id).join(', ');
        const regionIds = BODY_REGIONS.map(r => r.id).join(', ');

        // Initialize OpenAI lazily
        if (!process.env.OPENAI_API_KEY) {
             console.error("Missing OPENAI_API_KEY");
             return NextResponse.json({ error: 'Server misconfiguration: Missing API Key' }, { status: 500 });
        }
        
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Extract Structured Data via AI
        console.log("Sending to OpenAI...");
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', 
            messages: [
                { role: 'system', content: `
You are a medical data assistant.
Your task is to extract a Clinical Case scenario from the provided text and format it into JSON matching our schema.

Schema:
{
  "id": "String (Generate a unique slug id, e.g. case_knee_acl_athlete)",
  "title": "String (Short title in Japanese)",
  "archetypeId": "One of: [${archetypeIds}]",
  "regionId": "One of: [${regionIds}]",
  "categoryId": "String (Small alphanumeric slug for the specific pathology, e.g. acl, fracture)",
  "initialComplaint": "String (What the patient says first, in Japanese. Should be casual/realistic)",
  "scenarioContext": "String (Hidden context for AI simulator: Age, Gender, History, Physical Findings, Truth. Compact format.)",
  "trueDiagnosis": "String (The final diagnosis)",
  "requiredFindings": ["String (List of key findings/history points the user must uncover)"]
}

Ensure the JSON is valid.
                `},
                { role: 'user', content: `Here is the document text (truncated if too long):\n\n${rawText.substring(0, 15000)}` } 
            ],
            response_format: { type: "json_object" }
        });

        const extractedJson = JSON.parse(completion.choices[0].message.content || '{}');
        console.log("OpenAI extraction successful");

        return NextResponse.json({ 
            text: rawText.substring(0, 200) + "...", 
            extracted: extractedJson 
        });

    } catch (error: any) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
