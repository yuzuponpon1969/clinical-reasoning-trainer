import { NextResponse } from 'next/server';
import { MOCK_CASES, ARCHETYPES, BODY_REGIONS, Case } from '@/lib/data';
import { OpenAI } from 'openai';

export async function POST(request: Request) {
  const { archetypeId, regionId, categoryId } = await request.json();
  console.log(`Starting session for: ${archetypeId}, ${regionId}, ${categoryId}`);

  // 1. Try to find exact match from existing cases
  let validCase = MOCK_CASES.find(c => 
    c.archetypeId === archetypeId && 
    c.regionId === regionId &&
    c.categoryId === categoryId
  );
  
  // 2. If no exact match, GENERATE dynamically via LLM
  if (!validCase) {
    console.log("No existing case found. Generating dynamic case via LLM...");
    console.log("API Key Status:", process.env.OPENAI_API_KEY ? "Present" : "Missing");
    
    // Safety check for API Key
    if (!process.env.OPENAI_API_KEY) {
        console.error("Missing OPENAI_API_KEY");
        return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
    }

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Get labels for context
        // Resolve Region and Category Labels
        // Check if Archetype has navigation groups (overriding BODY_REGIONS)
        const archetype = ARCHETYPES.find(a => a.id === archetypeId);
        const activeRegionList = archetype?.navigationGroups || BODY_REGIONS;

        const region = activeRegionList.find(r => r.id === regionId);
        const category = region?.categories.find(c => c.id === categoryId);
        // Handle subcategories if implicit ? (Not yet implemented deep logic, but flattened in UI)

        if (!archetype || !region) {
          return NextResponse.json({ error: 'Invalid selection parameters' }, { status: 400 });
        }

        // Construct label for LLM
        // If specific category not found (maybe it was a subcategory?), fallback to ID or Region
        const effectiveCategory = category ? category.label : categoryId;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `
You are a medical education AI. 
Create a realistic clinical case scenario for a "Clinical Reasoning Trainer" app.
The case must match the provided Archetype (Patient Persona), Body Region, and Category.
Output strictly in JSON format.

Schema:
{
  "id": "String (Generate a unique slug, e.g. gen_child_elbow_pulled)",
  "title": "String (Short title in Japanese, e.g. '突然泣き出した2歳児')",
  "archetypeId": "${archetypeId}",
  "regionId": "${regionId}",
  "categoryId": "${categoryId}",
  "initialComplaint": "String (What the patient/parent says first in Japanese. Match the tone: '${archetype.tone}')",
  "scenarioContext": "String (Compact context: Age, Gender, HPI, Physical Findings, Vital Signs. Hidden from user.)",
  "patientProfile": {
     "name": "String (Japanese name)",
     "age": "String (e.g. '21歳')",
     "gender": "String (e.g. '男性')",
     "occupation": "String (e.g. '大学生（バスケットボール部）' or '会社員')",
     "chiefComplaint": "String (e.g. '右膝が痛い')",
     "onsetDate": "String (e.g. '5日前、練習中')",
     "history": "String (Brief history: mechanism of injury, current status)",
     "painScale": "Number (0-10 NRS)",
     "adlScale": "Number (0-10 Daily Life Interference)",
     "sportsScale": "Number (0-10 Sports Interference. Must be 0 if not an athlete/student)"
  },
  "trueDiagnosis": "String (The final diagnosis in Japanese)",
  "requiredFindings": ["String (List of 3-5 key findings/history points the user must uncover)"]
}
                `},
                { role: 'user', content: `Generate a case for:
- Archetype: ${archetype.label} (${archetype.description})
- Region: ${region.label}
- Specific Pathology/Category: ${effectiveCategory}

Ensure the scenario is medically accurate and typical for this presentation.` }
            ],
            response_format: { type: "json_object" }
        });

        const generatedData = JSON.parse(completion.choices[0].message.content || '{}');
        validCase = generatedData as Case;
        // Ensure IDs match what was requested to prevent routing errors
        validCase.archetypeId = archetypeId;
        validCase.regionId = regionId;
        validCase.categoryId = categoryId;
        
        console.log("Successfully generated dynamic case:", validCase.title);

        // PERSIST the generated case so api/chat can find it
        // We need to read the current file, check duplicates (unlikely if we generate unique ID), and append
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(process.cwd(), 'src', 'data', 'cases.json');
        
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const cases = JSON.parse(fileContent) as Case[];
            
            // Check if ID exists, if so append random suffix (though GPT is asked to generate slug)
            // But let's be safe
            if (cases.some(c => c.id === validCase!.id)) {
                 validCase.id = `${validCase.id}_${Math.floor(Math.random() * 1000)}`;
            }
            
            cases.push(validCase);
            await fs.writeFile(filePath, JSON.stringify(cases, null, 2), 'utf-8');
            console.log("Saved dynamic case to cases.json");
        } catch (filesErr) {
            console.error("Failed to save generated case to file:", filesErr);
            // We continue even if save fails? IDK. If save fails, api/chat fails. 
            // So we should probably error out or ensure api/chat can handle partial data (it can't).
            throw new Error("Failed to persist generated case");
        }

    } catch (e: any) {
        console.error("Failed to generate dynamic case:", e);
        return NextResponse.json({ error: "Failed to generate case scenario: " + e.message }, { status: 500 });
    }
  }

  // Double check we have a case now
  if (!validCase) {
      return NextResponse.json({ error: "Case creation failed" }, { status: 500 });
  }

  // In a real app, we would insert into DB here and get a Session ID
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);

  // Get Archetype Label for UI
  const archetypeObj = ARCHETYPES.find(a => a.id === validCase!.archetypeId);
  
  // Determine sports scale display
  const p = validCase.patientProfile;
  const sportsLine = (p?.sportsScale && p.sportsScale > 0) ? `\n■ スポーツ活動の支障度（NRS 0-10）：${p.sportsScale}` : "";

  // Construct Standardized Patient Profile (Questionnaire)
  const formattedProfile = `【予診票】
■ 患者名：${p?.name || "Unknown"}
■ 年齢・性別：${p?.age}・${p?.gender}
■ 職業/所属：${p?.occupation}
■ 主訴：${p?.chiefComplaint}
■ 受傷（発症）日時：${p?.onsetDate}
■ 簡単な経緯：${p?.history}
■ 痛みの程度（NRS 0-10）：${p?.painScale}
■ 日常生活の支障度（NRS 0-10）：${p?.adlScale}${sportsLine}
----------------------------
`;

  return NextResponse.json({
    sessionId,
    caseId: validCase.id,
    initialMessage: null, // Allow student to initiate conversation (greeting/name check)
    caseTitle: validCase.title,
    patientLabel: archetypeObj?.label || validCase.archetypeId,
    interviewFrames: archetypeObj?.interviewFrames || [],
    patientProfile: validCase.patientProfile || null
  });
}
