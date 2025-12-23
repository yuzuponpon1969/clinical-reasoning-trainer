import { OpenAI } from 'openai';
import { MOCK_CASES, ARCHETYPES } from '@/lib/data';
import { getPatientSystemPrompt } from '@/lib/prompts';

// Initialize OpenAI client
// NOTE: This usually requires an API Key. 
// For this environment, we might rely on the user providing one or it failing gracefully.
// However, the specification says "OpenAI keys are Workers env vars". 
// Here we are running locally. I will assume process.env.OPENAI_API_KEY is present or use a placeholder.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder-key',
});
console.log("API Key loaded:", process.env.OPENAI_API_KEY ? "Yes (" + process.env.OPENAI_API_KEY.substring(0,3) + "...)" : "No");

// export const runtime = 'edge'; // Removed to allow FS access
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, caseId } = await req.json();
    
    // 1. Retrieve Context
    // Read cases dynamically
    const { getCaseById } = require('@/lib/cases');
    const c = await getCaseById(caseId);
    
    if (!c) {
        return new Response(JSON.stringify({ error: 'Case not found' }), { status: 404 });
    }

    // RAG Retrieval Logic
    let knowledgeContext = "";
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Construct path: public/data/knowledge/{archetype}/{region}/{category}
        // We use the case's metadata to find the specific folder.
        // Falls back to empty string if any part is missing, but should be present for valid cases.
        const knowledgeDir = path.join(
            process.cwd(), 
            'public/data/knowledge', 
            c.archetypeId || '', 
            c.regionId || '', 
            c.categoryId || ''
        );

        let relevantDocs: any[] = [];
        
        // Check if directory exists
        try {
            await fs.access(knowledgeDir);
            const files = await fs.readdir(knowledgeDir);
            
            // Read all JSON files in this specific category folder
            // In a real system, we might limit this or use vector search.
            // Here we load all documents in the folder as "High Relevance"
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(knowledgeDir, file), 'utf-8');
                    try {
                        const doc = JSON.parse(content);
                        relevantDocs.push(doc);
                    } catch(e) {}
                }
            }
        } catch (e) {
            // Folder doesn't exist, which is fine
        }

        if (relevantDocs.length > 0) {
            // Take top docs. If too many, maybe limit.
            // For now, let's take up to 3.
            const contextText = relevantDocs.slice(0, 3).map((d: any) => 
                `[Source: ${d.title}]\n${d.content.substring(0, 4000)}...` // Increase limit slightly
            ).join("\n\n");
            
            knowledgeContext = `\n\n### EVIDENCED-BASED GUIDELINES (RAG)\nThe following medical guidelines are SPECIFIC to this condition (${c.trueDiagnosis}). Use these to accurately simulate symptoms, clinical course, and physical findings.\n${contextText}`;
        }
    } catch (e) {
        console.warn("RAG retrieval failed", e);
    }
    
    const archetype = ARCHETYPES.find(a => a.id === c.archetypeId) || ARCHETYPES[0];
    const systemPrompt = getPatientSystemPrompt(c, archetype, knowledgeContext);
    const conversation = [
        { role: 'system', content: systemPrompt },
        ...messages,
        {
          role: 'system',
          content: `
# 出力指示 (Output Instruction)
あなたの応答は、必ず以下のJSON形式のみとします。いかなる説明や補足も絶対にJSONの外に記述してはいけません。
応答テキスト（content）内で表形式が必要な場合は、必ずMarkdownテーブル形式を使用し、構造を崩さないでください。
**空文字禁止**: contentの中身が空文字になることは絶対に避けてください。
**自然な会話**: 「特にありません」と機械的に答えるのではなく、質問の文脈に合わせて自然に（「いいえ、初めてです」「覚えていません」など）答えてください。

{"role": "patient" | "instructor", "content": "..."}
`
        }
    ];

    // 3. Call OpenAI with JSON mode
    console.log('Calling OpenAI API with JSON mode...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversation as any,
      response_format: { type: "json_object" },
      stream: false,
      max_tokens: 1500, // Increased for detailed ultrasound responses
      temperature: 0.7,
    });

    // 4. Parse JSON response and extract role
    const aiMessage = response.choices[0]?.message?.content || '{}';
    console.log('Raw AI Message (first 300 chars):', aiMessage.substring(0, 300));
    
    let parsedResponse: { role: string; content: string };
    try {
      parsedResponse = JSON.parse(aiMessage);
      console.log('Successfully parsed. Role:', parsedResponse.role);
      
      // Validate structure
      if (!parsedResponse.role) {
        console.error('Missing role in parsed response:', parsedResponse);
        throw new Error('Invalid AI response structure: Missing role');
      }
      
      // Safety Fallback for empty content
      if (!parsedResponse.content || parsedResponse.content.trim() === "") {
         console.warn("AI returned empty content. Applying fallback.");
         parsedResponse.content = "申し訳ありません、うまく聞き取れませんでした。もう一度お願いします。"; // Natural fallback
      }
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', parseError);
      console.error('Raw response:', aiMessage);
      
      // Fallback: treat as patient role
      parsedResponse = {
        role: 'patient',
        content: aiMessage
      };
    }

    // 5. Return structured JSON with role metadata
    console.log('Returning response with role:', parsedResponse.role);
    return new Response(JSON.stringify({
      role: parsedResponse.role,
      content: parsedResponse.content
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error("CHAT API ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
