import { OpenAI } from 'openai';
import { getFactCheckSystemPrompt, getScoringSystemPrompt, SoapEvaluationResult, FactCheckResult } from '@/lib/pdqi9';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { soapData, chatHistory, caseId } = await req.json();

    if (!soapData || !caseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare inputs
    const transcript = chatHistory
        .map((m: any) => `[${m.role === 'user' ? 'Student' : 'Patient/Instructor'}]: ${m.content}`)
        .join('\n');

    const soapText = `
S:
${soapData.subjective}
O:
${soapData.objective}
A:
${soapData.assessment}
P:
${soapData.plan}
    `.trim();

    // --- Pass A: Fact Check (Verification) ---
    console.log(`[Eval] Starting Pass A (FactCheck) for Case ${caseId}...`);
    const factCheckSystem = getFactCheckSystemPrompt(transcript);
    const factCheckResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: factCheckSystem },
            { role: 'user', content: `以下を突き合わせ、SOAPの各文が面接ログで裏付けられるか判定し、JSONで出力してください。\n\n【soap_note】\n${soapText}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0, // Strict fact checking
    });

    const factCheckResult: FactCheckResult = JSON.parse(factCheckResponse.choices[0].message.content || '{}');
    console.log(`[Eval] Pass A Complete. Supported: ${factCheckResult.supported_claims?.length}, Issues: ${(factCheckResult.missing_from_soap?.length || 0) + (factCheckResult.hallucination_risk?.length || 0)}`);

    // --- Pass B: Scoring (Q-NOTE + PDQI-8) ---
    console.log(`[Eval] Starting Pass B (Scoring)...`);
    const scoringSystem = getScoringSystemPrompt(JSON.stringify(factCheckResult, null, 2));
    const scoringResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: scoringSystem },
            { role: 'user', content: `以下のSOAPノートを、事実照合結果に基づいて評価し、JSONで出力してください。\n\n【soap_note】\n${soapText}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
    });

    const scoringResult = JSON.parse(scoringResponse.choices[0].message.content || '{}');
    
    // Combine results
    const finalResult: SoapEvaluationResult = {
        ...scoringResult,
        fact_check: factCheckResult // Attach fact check for UI
    };

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('SOAP Evaluation Error:', error);
    return NextResponse.json({ error: 'Failed to evaluate SOAP' }, { status: 500 });
  }
}
