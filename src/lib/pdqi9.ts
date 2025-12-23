export type EvaluationSection = 'S' | 'O' | 'A' | 'P';

// --- Pass A: Fact Check Model ---
export interface SupportedClaim {
  section: EvaluationSection;
  claim_text: string;
  support: 'supported' | 'partial' | 'unsupported';
  evidence_quotes: string[];
  notes?: string;
}

export interface MissingItem {
  category: 'history' | 'symptom' | 'red_flag' | 'medication' | 'allergy' | 'social' | 'preference' | 'other';
  importance: 'critical' | 'important' | 'nice_to_have';
  item: string;
  evidence_quotes: string[];
}

export interface HallucinationRisk {
  section: EvaluationSection;
  item: string;
  severity: 'high' | 'medium' | 'low';
  why: string;
}

export interface FactCheckResult {
  version: string;
  supported_claims: SupportedClaim[];
  missing_from_soap: MissingItem[];
  hallucination_risk: HallucinationRisk[];
}

// --- Pass B: Scoring Model ---
export interface ScoreItem {
  score_1to5: number;
  rationale: string;
  one_line_fix: string;
}

export interface QNoteScores {
  Clear: ScoreItem;
  Complete: ScoreItem;
  Concise: ScoreItem;
  Current: ScoreItem;
  Organized: ScoreItem;
  Prioritized: ScoreItem;
  Sufficient: ScoreItem;
}

export interface Pdqi8Scores {
  Accurate: ScoreItem;
  Thorough: ScoreItem;
  Useful: ScoreItem;
  Organized: ScoreItem;
  Comprehensible: ScoreItem;
  Succinct: ScoreItem;
  Synthesized: ScoreItem;
  InternallyConsistent: ScoreItem;
}

export interface PriorityFix {
  rank: number;
  issue: string;
  why: string;
  where: EvaluationSection;
  example_patch: string;
}

export interface SoapEvaluationResult {
  version: string;
  scores: {
    q_note: QNoteScores;
    pdqi_8: Pdqi8Scores;
  };
  totals: {
    q_note_total: number;
    pdqi_total: number;
    overall_comment: string;
  };
  priority_fixes_top3: PriorityFix[];
  flags: {
    red_flags_missing: boolean;
    hallucination_high: boolean;
  };
  // Store Fact Check for UI display
  fact_check?: FactCheckResult;
}

// --- Prompts ---

export function getFactCheckSystemPrompt(transcript: string): string {
  return `
あなたは医療面接ログとSOAPカルテを突き合わせる「記録監査者」です。
次のルールを必ず守ってください。

【ルール】
1) 医療面接ログに明示されていない情報は「根拠なし」と判定する（推測で補わない）。
2) 判定は必ずログの引用（該当箇所の短い抜粋）を添える。引用ができない場合は根拠なし。
3) 出力は指定されたJSONのみ。余計な文章は禁止。
4) 個人情報は出力に含めない（氏名等は伏せる）。

【medical_interview_transcript】
${transcript}

【出力JSONスキーマ】
{
  "version": "factcheck_v1",
  "supported_claims": [
    {
      "section": "S|O|A|P",
      "claim_text": "...",
      "support": "supported|partial|unsupported",
      "evidence_quotes": ["ログの短い抜粋1"],
      "notes": "不足や曖昧さがあれば短く"
    }
  ],
  "missing_from_soap": [
    {
      "category": "history|symptom|red_flag|medication|allergy|social|preference|other",
      "importance": "critical|important|nice_to_have",
      "item": "SOAPに書かれていないがログにある情報",
      "evidence_quotes": ["ログ抜粋"]
    }
  ],
  "hallucination_risk": [
    {
      "section": "S|O|A|P",
      "item": "ログにないのにSOAPに書かれている内容",
      "severity": "high|medium|low",
      "why": "なぜ根拠がないか"
    }
  ]
}
`.trim();
}

export function getScoringSystemPrompt(factCheckJson: string): string {
  return `
あなたは医学教育の評価者です。SOAPノートをQ-NOTE(7属性)とPDQI-8(8ドメイン)で評価します。
ただし、必ず事実照合結果（factcheck）に基づいて採点してください。

【採点ルール（重要）】
- 1～5点のリッカートで評価。
- **4点以上は厳格に**：根拠(ログ整合)が明確で、欠落や混入が軽微な場合のみ許可します。
- factcheckでunsupported/partialが多い場合、Accurate / Internally Consistent / Sufficient を大きく減点してください。
- 出力はJSONのみ。余計な文章は禁止。

【factcheck_json】
${factCheckJson}

【Q-NOTE属性（7）】
- Clear: あいまいさがなく誰が読んでも同一解釈（略語乱用なし）
- Complete: 診断/方針に必要情報が揃う（S/O/A/Pが揃う）
- Concise: 冗長・不要な繰り返しがない
- Current: 現在の状態を反映し古い問題の残存がない
- Organized: SOAP等の標準形式で構造化、配置が適切
- Prioritized: 重要/緊急の問題が上位、強調される
- Sufficient: A/Pを正当化する十分な根拠（S/O）がある

【PDQI-8ドメイン（Up-to-date除外）】
- Accurate
- Thorough
- Useful
- Organized
- Comprehensible
- Succinct
- Synthesized
- Internally Consistent

【出力JSONスキーマ】
{
  "version": "soap_eval_v1",
  "scores": {
    "q_note": {
        "Clear": { "score_1to5": 1, "rationale": "...", "one_line_fix": "..." },
        "Complete": {...},
        "Concise": {...},
        "Current": {...},
        "Organized": {...},
        "Prioritized": {...},
        "Sufficient": {...}
    },
    "pdqi_8": {
        "Accurate": { "score_1to5": 1, "rationale": "...", "one_line_fix": "..." },
        "Thorough": {...},
        "Useful": {...},
        "Organized": {...},
        "Comprehensible": {...},
        "Succinct": {...},
        "Synthesized": {...},
        "InternallyConsistent": {...}
    }
  },
  "totals": {
    "q_note_total": 0,
    "pdqi_total": 0,
    "overall_comment": "総評は2～3文まで"
  },
  "priority_fixes_top3": [
    {
      "rank": 1,
      "issue": "最重要の修正点",
      "why": "理由（安全性・推論・可読性など）",
      "where": "S|O|A|P",
      "example_patch": "差分で1～2行（全面書き換えは禁止）"
    }
  ],
  "flags": {
    "red_flags_missing": true,
    "hallucination_high": true
  }
}
`.trim();
}
