import casesData from '@/data/cases.json';

export interface Archetype {
  id: string;
  label: string;
  description: string;
  tone: string;
  navigationGroups?: BodyRegion[]; // Replaced 'customGroups' for clarity: The Selection Layer
  interviewFrames?: {
    title: string;
    items: string[];
  }[]; // The Interview Frame Layer (Fixed display)
}

// Reuse BodyRegion interface for the navigation groups


export interface BodyRegion {
  id: string;
  label: string;
  categories: Category[];
}

export interface Category {
  id: string;
  label: string;
  subcategories?: Category[];
}

export interface Case {
  id: string;
  title: string;
  archetypeId: string;
  regionId: string;
  categoryId: string; // or subcategoryId
  initialComplaint: string;
  scenarioContext: string; // Hidden from user
  trueDiagnosis: string;
  requiredFindings: string[];
  patientProfile?: {
      name: string;
      age: string;
      gender: string;
      occupation: string;
      chiefComplaint: string;
      onsetDate: string;
      history: string;
      painScale: number;
      adlScale: number;
      sportsScale: number;
  };
}

export const ARCHETYPES: Archetype[] = [
  { 
    id: 'child', 
    label: '幼小児 (Toddler/Child)', 
    description: '保護者同伴。痛みの表現が曖昧。虐待の可能性も考慮。', 
    tone: 'Anxious parent answering for a child. Or a shy child.',
    navigationGroups: [
      {
        id: 'child_trauma',
        label: '外傷 (Trauma)',
        categories: [
          { id: 'clavicle_fx', label: '鎖骨骨折' },
          { id: 'supracondylar_fx', label: '上腕骨顆上骨折' },
          { id: 'pulled_elbow', label: '肘内障' }
        ]
      },
      {
        id: 'child_congenital',
        label: '先天・発育異常 (Congenital)',
        categories: [
           { id: 'ddh', label: '発育性股関節形成不全 (DDH)' },
           { id: 'torticollis', label: '筋性斜頸' },
           { id: 'clubfoot', label: '内反足' }
        ]
      },
      {
        id: 'child_growth',
        label: '成長関連疾患 (Growth)',
        categories: [
          { id: 'perthes', label: 'ペルテス病' },
          { id: 'scfe', label: '大腿骨頭すべり症 (SCFE)' }
        ]
      }
    ],
    interviewFrames: [
        { title: 'A. 主訴と経過', items: ['保護者からの聴取', '数日以内'] },
        { title: 'B. 受傷機転・誘因', items: ['不明確が多い', '目を離した隙'] },
        { title: 'C. 痛み・症状の性質', items: ['表現が曖昧', '泣き止まない', '不機嫌'] },
        { title: 'D. 機能障害・生活影響', items: ['歩行拒否', '遊びの中断', '腕を使わない'] },
        { title: 'E. 背景因子', items: ['発達段階', '月齢・年齢', '家庭環境'] },
        { title: 'F. レッドフラッグ', items: ['虐待の可能性', '発育異常の兆候', '意識障害'] },
        { title: 'G. 患者ニーズ・ゴール', items: ['家族の不安解消', '整復完了', '元の生活'] }
    ]
  },
  { 
    id: 'growth_student', 
    label: '成長期・学生 (School Age)', 
    description: '骨端線損傷や骨端症（オスグッド等）が好発。部活動での障害も多い。', 
    tone: 'Active teenager, sometimes vague about pain location.',
    navigationGroups: [
      {
        id: 'growth_knee',
        label: '膝 (Knee)',
        categories: [
           { id: 'osgood', label: 'オスグッド病' },
           { id: 'jumper', label: 'ジャンパー膝' },
           { id: 'meniscus', label: '半月板損傷' }
        ]
      },
      {
        id: 'growth_ankle',
        label: '足部・足関節 (Foot/Ankle)',
        categories: [
           { id: 'sever', label: 'シーバー病' },
           { id: 'navicular', label: '有痛性外脛骨' },
           { id: 'ankle_sprain', label: '足関節捻挫' }
        ]
      },
      {
        id: 'growth_elbow',
        label: '肘 (Elbow)',
        categories: [
           { id: 'baseball_elbow', label: '野球肘（内側障害）' },
           { id: 'ocd', label: '離断性骨軟骨炎' }
        ]
      },
      {
        id: 'growth_lumbar',
        label: '腰 (Lumbar)',
        categories: [
           { id: 'spondylolysis', label: '腰椎分離症' },
           { id: 'spondylolisthesis', label: '腰椎すべり症' }
        ]
      }
    ],
    interviewFrames: [
        { title: 'A. 主訴と経過', items: ['いつから痛いか', 'きっかけは明確か'] },
        { title: 'B. 受傷機転・誘因', items: ['部活の内容', '練習量の変化', 'ポジション変更'] },
        { title: 'C. 痛み・症状の性質', items: ['運動時痛', '練習後の痛み', '圧痛の場所'] },
        { title: 'D. 機能障害・生活影響', items: ['学業への支障', '全力で走れない', '正座困難'] },
        { title: 'E. 背景因子', items: ['成長期（身長の伸び）', '身体の硬さ', '競技レベル'] },
        { title: 'F. レッドフラッグ', items: ['夜間痛（骨腫瘍）', '発熱', '体重減少'] },
        { title: 'G. 患者ニーズ・ゴール', items: ['競技継続', 'レギュラー争い', '試合出場'] }
    ]
  },
  { 
    id: 'athlete', 
    label: 'アスリート (Athlete)', 
    description: '早期の競技復帰を強く希望。外傷（明確な受傷起点）に加え、オーバーユースによる障害も考慮が必要。', 
    tone: 'Stoic, focused on return to play. Knows exact moment of injury.',
    navigationGroups: [
      {
        id: 'athlete_knee',
        label: '膝 (Knee)',
        categories: [
           { id: 'acl', label: 'ACL損傷' },
           { id: 'meniscus', label: '半月板損傷' },
           { id: 'patellar_tendinitis', label: '膝蓋腱炎' }
        ]
      },
      {
        id: 'athlete_ankle',
        label: '足関節・足部 (Ankle/Foot)',
        categories: [
           { id: 'lateral_ligament', label: '外側靱帯損傷' },
           { id: 'high_ankle', label: '高位足関節捻挫' },
           { id: 'footballers_ankle', label: 'フットボーラズアンクル' }
        ]
      },
      {
        id: 'athlete_hip',
        label: '股関節 (Hip)',
        categories: [
           { id: 'groin_pain', label: '鼠径部痛症候群' },
           { id: 'fais', label: 'FAIS' }
        ]
      },
      {
        id: 'athlete_shoulder',
        label: '肩 (Shoulder)',
        categories: [
           { id: 'rotator_cuff', label: '腱板損傷' },
           { id: 'impingement', label: 'インピンジメント症候群' },
           { id: 'biceps_tendonitis', label: '上腕二頭筋長頭腱炎' }
        ]
      }
    ],
    interviewFrames: [
        { title: 'A. 主訴と経過', items: ['受傷直後の対応', '再発かどうか'] },
        { title: 'B. 受傷機転・誘因', items: ['競技動作の詳細', '接触の有無', 'フィールドの状態'] },
        { title: 'C. 痛み・症状の性質', items: ['プレー続行可否', 'ロッキング・不安定感', '腫脹のスピード'] },
        { title: 'D. 機能障害・生活影響', items: ['パフォーマンス低下', 'フォームの崩れ', '恐怖心'] },
        { title: 'E. 背景因子', items: ['競技レベル', '練習量・頻度', '大事な試合の予定'] },
        { title: 'F. レッドフラッグ', items: ['完全断裂の疑い', '神経損傷合併', 'コンパートメント'] },
        { title: 'G. 患者ニーズ・ゴール', items: ['早期復帰 (RTP)', 'パフォーマンス向上', '再発予防'] }
    ]
  },
  { 
    id: 'worker_adult', 
    label: '労働者・青壮年 (Worker/Adult)', 
    description: '労働災害や職業病（デスクワークの腰痛、肉体労働の外傷）。日常生活や仕事への早期復帰が鍵。', 
    tone: 'Busy worker, worried about sick leave and income.',
    navigationGroups: [
      {
        id: 'worker_lumbar',
        label: '腰 (Lumbar)',
        categories: [
           { id: 'lbp', label: '腰痛症' },
           { id: 'hernia', label: '椎間板ヘルニア' },
           { id: 'acute_lbp', label: 'ぎっくり腰' }
        ]
      },
      {
        id: 'worker_upper',
        label: '頸・肩・上肢 (Neck/Upper Limb)',
        categories: [
           { id: 'cervicobrachial', label: '頸肩腕症候群' },
           { id: 'tos', label: '胸郭出口症候群' },
           { id: 'tennis_elbow', label: 'テニス肘' },
           { id: 'de_quervain', label: 'ドケルバン病' },
           { id: 'cts', label: '手根管症候群' },
           { id: 'cubital_tunnel', label: '肘部管症候群' }
        ]
      }
    ],
    interviewFrames: [
        { title: 'A. 主訴と経過', items: ['仕事中の発生', '徐々に悪化か'] },
        { title: 'B. 受傷機転・誘因', items: ['作業姿勢', '反復動作', '重量物挙上'] },
        { title: 'C. 痛み・症状の性質', items: ['しびれの有無', '安静時痛', '夜間痛'] },
        { title: 'D. 機能障害・生活影響', items: ['仕事への支障', 'ADL（着替え・洗顔）', '睡眠障害'] },
        { title: 'E. 背景因子', items: ['職業・職種', '勤続年数', '利き手', '喫煙歴'] },
        { title: 'F. レッドフラッグ', items: ['悪性腫瘍', '感染', '脊髄症状（膀胱直腸障害）'] },
        { title: 'G. 患者ニーズ・ゴール', items: ['就労復帰', '休業補償の不安解消', '配置転換の要否'] }
    ]
  },
  { 
    id: 'elderly', 
    label: '高齢者 (Elderly)', 
    description: '変性疾患、転倒骨折、レッドフラッグ（悪性腫瘍等）。', 
    tone: 'Slow talker, multiple complaints, forgets details.',
    navigationGroups: [
      {
        id: 'elderly_trauma',
        label: '転倒・外傷 (Trauma)',
        categories: [
           { id: 'femoral_neck_fx', label: '大腿骨近位部骨折' },
           { id: 'distal_radius_fx', label: '橈骨遠位端骨折' },
           { id: 'compression_fx', label: '脊椎圧迫骨折' }
        ]
      },
      {
        id: 'elderly_degenerative',
        label: '変性疾患 (Degenerative)',
        categories: [
           { id: 'knee_oa', label: '変形性膝関節症' },
           { id: 'hip_oa', label: '変形性股関節症' },
           { id: 'spinal_stenosis', label: '脊柱管狭窄症' }
        ]
      },
      {
        id: 'elderly_nerve',
        label: '神経・二次障害 (Nerve)',
        categories: [
           { id: 'cts', label: '手根管症候群' },
           { id: 'cubital_tunnel', label: '肘部管症候群' }
        ]
      }
    ],
    interviewFrames: [
        { title: 'A. 主訴と経過', items: ['いつからか（慢性/急性）', '認知機能の影響'] },
        { title: 'B. 受傷機転・誘因', items: ['転倒歴の詳細', '目撃者の有無', 'ふらつき'] },
        { title: 'C. 痛み・症状の性質', items: ['関連痛', '日内変動', '天候による変化'] },
        { title: 'D. 機能障害・生活影響', items: ['ADL（排泄・入浴）', '自立度', '歩行能力'] },
        { title: 'E. 背景因子', items: ['既往歴（骨粗鬆症他）', '服薬状況', '社会的孤立'] },
        { title: 'F. レッドフラッグ', items: ['悪性腫瘍の転移', '化膿性関節炎', '病的骨折'] },
        { title: 'G. 患者ニーズ・ゴール', items: ['生活の質の維持', '寝たきり防止', '介護負担軽減'] }
    ]
  },
];

export const BODY_REGIONS: BodyRegion[] = [
  {
    id: 'knee',
    label: '膝関節 (Knee)',
    categories: [
      {
        id: 'knee_trauma',
        label: '外傷 (Acute Trauma)',
        subcategories: [
          { id: 'acl', label: 'ACL (前十字靭帯)' },
          { id: 'mcl', label: 'MCL (内側側副靭帯)' },
          { id: 'meniscus', label: '半月板 (Meniscus)' },
          { id: 'fracture', label: '骨折 (Fracture)' },
        ]
      },
      {
        id: 'knee_sports',
        label: 'スポーツ障害 (Overuse)',
        subcategories: [
          { id: 'osgood', label: 'オスグッド' },
          { id: 'jumper', label: 'ジャンパー膝' },
          { id: 'itb', label: '腸脛靭帯炎' }
        ]
      },
      { 
        id: 'knee_oa', 
        label: '変性 (OA/Chronic)',
        subcategories: [] 
      },
      { id: 'knee_red', label: 'Red Flags', subcategories: [] }
    ]
  },
  {
    id: 'shoulder',
    label: '肩関節 (Shoulder)',
    categories: [
       { id: 'shoulder_trauma', label: '外傷' },
       { id: 'shoulder_stiff', label: '拘縮 (五十肩)' }
    ]
  },
  { id: 'lumbar', label: '腰部 (Lumbar)', categories: [] },
  { id: 'ankle', label: '足関節 (Ankle)', categories: [] },
];

export const MOCK_CASES: Case[] = casesData as Case[];
