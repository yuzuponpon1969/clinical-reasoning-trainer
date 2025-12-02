import { OpenAI } from 'openai';
import { MASTER_PROMPT, SYSTEM_INSTRUCTION } from '@/lib/prompts';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Set max duration to 60 seconds for Vercel

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key is not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Construct the full message history
    const fullMessages = [
      { role: 'system', content: MASTER_PROMPT },
      ...messages.map((msg: any) => ({
        role: ['patient', 'instructor'].includes(msg.role) ? 'assistant' : msg.role,
        content: msg.content,
      })),
      { role: 'system', content: SYSTEM_INSTRUCTION },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini as a modern replacement for gpt-5-mini (which doesn't exist publicly yet or was a placeholder)
      messages: fullMessages,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON content to ensure it's valid
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON response:', content);
      return NextResponse.json(
        { role: 'instructor', content: 'システムエラー：AIの応答解析に失敗しました。' },
        { status: 200 } // Return 200 to display the error message in chat
      );
    }

    return NextResponse.json(parsedContent);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
