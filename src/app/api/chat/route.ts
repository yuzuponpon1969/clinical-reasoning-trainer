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
        const { supabase } = require('@/lib/supabase');
        
        // Query Knowledge Items matching hierarchy
        // In a real system we'd use vector search, but here we use exact metadata matching
        // which matches the user's "Knowledge Base" organization strategy.
        const { data: relevantDocs, error } = await supabase
            .from('knowledge_items')
            .select('title, content')
            .match({
                archetype_id: c.archetypeId || '',
                region_id: c.regionId || '',
                category_id: c.categoryId || ''
            })
            .limit(3); 

        if (!error && relevantDocs && relevantDocs.length > 0) {
            const contextText = relevantDocs.map((d: any) => 
                `[Source: ${d.title}]\n${d.content.substring(0, 4000)}...`
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
      model: 'gpt-5-mini', 
      messages: conversation as any,
      response_format: { type: "json_object" },
      stream: false,
      max_completion_tokens: 2000,
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
