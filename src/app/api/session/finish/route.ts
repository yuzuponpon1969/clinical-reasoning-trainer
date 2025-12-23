import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { MOCK_CASES } from '@/lib/data';
import { getCoachSystemPrompt } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder-key',
});

export async function POST(req: Request) {
    try {
        const { messages, caseId, userSummary } = await req.json();

        const c = MOCK_CASES.find(item => item.id === caseId) || MOCK_CASES[0];
        
        // Format transcript for the prompt
        const transcript = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        
        const prompt = getCoachSystemPrompt(c, transcript, userSummary);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        return NextResponse.json(JSON.parse(result || '{}'));

    } catch (error: any) {
        console.error(error);
        // Fallback Mock result if API fails (e.g. no key)
        return NextResponse.json({
            total_score: 15,
            dimensions: [
                { key: "opqrst_hpi", score: 3, max: 5, feedback: "Missing Timeline details." },
                { key: "red_flags", score: 3, max: 5, feedback: "Asked about numbness but missed fever." },
                { key: "hypothesis", score: 3, max: 5, feedback: "Good ACL suspicion." },
                { key: "communication", score: 4, max: 5, feedback: "Polite." },
                { key: "summary_plan", score: 2, max: 5, feedback: "Summary was too brief." }
            ],
            strengths: ["Polite tone"],
            improvements: ["Dig deeper into history"],
            next_questions: ["Did you hear a pop?"],
            rationale_links: []
        });
    }
}
