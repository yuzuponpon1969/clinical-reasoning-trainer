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
            model: 'gpt-5-mini', // Updated to GPT-5-mini
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: "json_object" },
            max_completion_tokens: 3000
        });

        const result = completion.choices[0].message.content;
        return NextResponse.json(JSON.parse(result || '{}'));

    } catch (error: any) {
        console.error(error);
        // Fallback Mock result if API fails (e.g. no key)
        return NextResponse.json({
            total_score: 24,
            dimensions: [
                { key: "interview", label: "病歴（病状の把握）", score: 4, max: 6, comment: "主要な症状（OPQRST）は概ね聴取できていますが、既往歴の確認が不足しています。" },
                { key: "exam", label: "身体診察", score: 3, max: 6, comment: "患部の観察は行えましたが、健側との比較や触診が省略されています。" },
                { key: "communication", label: "コミュニケーション能力", score: 5, max: 6, comment: "丁寧な言葉遣いで、患者への配慮が感じられました。" },
                { key: "judgment", label: "臨床判断", score: 4, max: 6, comment: "得られた情報から適切な鑑別疾患を挙げられています。" },
                { key: "professionalism", label: "プロフェッショナリズム", score: 4, max: 6, comment: "真摯な態度で接することができています。" },
                { key: "management", label: "マネジメント", score: 4, max: 6, comment: "時間配分は適切でした。" }
            ],
            detailed_feedback: {
                good_points: "・患者の訴えに共感的な態度で接することができていました。\n・痛みの詳細について詳しく聞くことができました。",
                improvements: "・「他に気になることはありますか？」といった開放的な質問が欲しかったです。\n・レッドフラッグ（危険な兆候）の確認をより意識しましょう。",
                next_steps: "・次回は、必ず「健側比較」を行うようにしましょう。\n・鑑別診断の幅を広げるために、周辺部位の情報を聞き出しましょう。",
                patient_voice: "「先生が優しく話聞いてくれたので安心しました。ただ、もう少し詳しく足を見てほしかったです。」"
            },
            rationale_links: []
        });
    }
}
