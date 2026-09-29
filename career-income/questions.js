'use strict';

const q = (id, category, title, options) => ({ id, category, title, options });

const COMMON_QUESTIONS = [
  q('age', 'BASIC PROFILE', '年齢を教えてください', [
    ['20-22', '20〜22歳'], ['23-25', '23〜25歳'], ['26-29', '26〜29歳'], ['30-34', '30〜34歳'], ['35+', '35歳以上']
  ]),
  q('employment', 'BASIC PROFILE', '現在の働き方を教えてください', [
    ['regular', '正社員'], ['contract', '契約社員・派遣社員'], ['parttime', 'アルバイト・パート'], ['freelance', 'フリーランス・個人事業主'], ['unemployed', '現在は働いていない']
  ]),
  q('job', 'CURRENT CAREER', '現在の仕事に最も近いものを教えてください', [
    ['realestate', '不動産営業'], ['doorSales', '太陽光・住宅設備などの訪問販売'], ['hrSales', '人材紹介・求人広告の営業'], ['reuseSales', '買取・リユース営業'], ['otherSales', 'その他の営業職'], ['service', '接客・販売・サービス職'], ['office', '事務・バックオフィス'], ['nurse', '看護師・医療職'], ['teacher', '保育士・教育職'], ['engineer', 'エンジニア・IT職'], ['marketing', 'マーケティング・広告職'], ['operations', '建設・製造・物流職'], ['other', 'その他']
  ]),
  q('income', 'CURRENT CAREER', '現在の年収を教えてください', [
    ['180', '200万円未満'], ['225', '200万〜249万円'], ['275', '250万〜299万円'], ['325', '300万〜349万円'], ['375', '350万〜399万円'], ['425', '400万〜449万円'], ['475', '450万〜499万円'], ['550', '500万〜599万円'], ['650', '600万〜699万円'], ['750', '700万〜799万円'], ['850', '800万円以上']
  ]),
  q('experience', 'EXPERIENCE', '現在の職種での経験年数を教えてください', [
    ['lt1', '1年未満'], ['1-2', '1年以上2年未満'], ['2-3', '2年以上3年未満'], ['3-5', '3年以上5年未満'], ['5-10', '5年以上10年未満'], ['10+', '10年以上']
  ]),
  q('role', 'EXPERIENCE', '現在の仕事での役割に最も近いものを教えてください', [
    ['learning', '教えてもらいながら業務を行っている'], ['independent', '一人で担当業務を完結できる'], ['training', '新人や後輩の指導をしている'], ['leader', 'チームの進捗や目標を管理している'], ['manager', '管理職として人員や売上を管理している'], ['owner', '事業や部署全体の責任を持っている']
  ]),
  q('achievement', 'PERFORMANCE', '仕事上の成果について、最も近いものを教えてください', [
    ['none', 'まだ明確な成果はない'], ['stable', '任された業務を安定して行っている'], ['target', '設定された目標を達成したことがある'], ['numbers', '売上や件数など、数字で説明できる成果がある'], ['repeat', '継続的に目標を達成している'], ['award', '社内表彰や上位成績を獲得したことがある'], ['team', 'チームや部署全体の成果を改善したことがある']
  ]),
  q('direction', 'NEXT CAREER', '転職するとしたら、どの方向を考えていますか？', [
    ['same', '現在と同じ職種で年収を上げたい'], ['otherIndustry', '現在の経験を活かして別業界へ移りたい'], ['otherRole', '現在の経験を活かして別職種へ移りたい'], ['new', '未経験の職種へ挑戦したい'], ['management', '管理職やリーダー職を目指したい'], ['proposal', '自分に合う仕事を知りたい'], ['undecided', 'まだ具体的には考えていない']
  ]),
  q('area', 'NEXT CAREER', '転職先として希望する勤務地を教えてください', [
    ['tokyo', '東京'], ['osaka', '大阪'], ['nagoya', '名古屋'], ['fukuoka', '福岡'], ['undecided', 'まだ決めていない']
  ])
];

const BRANCH_QUESTIONS = {
  sales: [
    q('salesStyle', 'SALES EXPERIENCE', 'これまで最も経験した営業スタイルを教えてください', [
      ['b2cNew', '個人向けの新規営業'], ['b2bNew', '法人向けの新規営業'], ['visit', '訪問販売'], ['inside', '電話・オンライン営業'], ['inbound', '問い合わせに対応する反響営業'], ['existing', '既存顧客への営業'], ['multiple', '複数の営業スタイルを経験している']
    ]),
    q('priceBand', 'SALES EXPERIENCE', '主に扱っていた商品の価格帯を教えてください', [
      ['lt10', '10万円未満'], ['10-49', '10万〜49万円'], ['50-99', '50万〜99万円'], ['100-299', '100万〜299万円'], ['300+', '300万円以上'], ['unknown', '価格は分からない'], ['none', '金額のある商品は扱っていない']
    ]),
    q('salesPerformance', 'SALES EXPERIENCE', '直近の営業成績に最も近いものを教えてください', [
      ['lt80', '目標達成率80％未満'], ['80-99', '目標達成率80〜99％'], ['100', '目標を達成している'], ['120+', '目標達成率120％以上'], ['top20', '社内上位20％以内'], ['top', '社内表彰やトップ成績の経験がある'], ['unknown', '具体的な数字は分からない']
    ])
  ],
  licensed: [
    q('qualification', 'SPECIALIZED EXPERIENCE', '保有資格について、最も近いものを教えてください', [
      ['national', '国家資格を保有している'], ['specialized', '業務に必要な専門資格を保有している'], ['multiple', '複数の専門資格を保有している'], ['none', '資格は保有していない'], ['skip', '回答しない']
    ]),
    q('licensedDirection', 'SPECIALIZED EXPERIENCE', '今後のキャリアとして最も興味があるものを教えてください', [
      ['same', '資格を活かして職場を変えたい'], ['corporate', '資格や経験を活かして一般企業で働きたい'], ['hr', '人材・採用関連の仕事に興味がある'], ['sales', '営業や接客経験を活かせる仕事に興味がある'], ['new', '全く異なる職種に挑戦したい'], ['undecided', 'まだ決めていない']
    ])
  ],
  digital: [
    q('skillLevel', 'SPECIALIZED EXPERIENCE', '現在の実務レベルに最も近いものを教えてください', [
      ['learning', '現在学習中で実務経験はない'], ['assist', '補助業務を担当している'], ['guided', '指示を受けながら一連の業務を行える'], ['independent', '一人で業務を完結できる'], ['owner', '施策やプロジェクトの責任を持っている'], ['manager', 'チームやプロジェクトを管理している']
    ]),
    q('measurableOutcome', 'SPECIALIZED EXPERIENCE', '実務成果をどの程度具体的に説明できますか？', [
      ['none', 'まだ実務成果はない'], ['tasks', '担当した業務内容は説明できる'], ['change', '改善前後の変化を説明できる'], ['numbers', '売上・費用・件数などの数字で説明できる'], ['multiple', '複数の成果を数字で説明できる'], ['team', 'チーム全体の成果を説明できる']
    ])
  ],
  general: [
    q('strength', 'TRANSFERABLE SKILLS', '現在の仕事で身につけた強みに最も近いものを教えてください', [
      ['communication', '顧客対応・コミュニケーション'], ['accuracy', '業務の正確性・事務処理'], ['data', '数字やデータの管理'], ['improvement', '業務改善・効率化'], ['management', '後輩の教育・チーム管理'], ['specialized', '専門的な技術や資格'], ['unknown', 'まだ明確な強みが分からない']
    ]),
    q('processImprovement', 'TRANSFERABLE SKILLS', '業務を改善した経験について教えてください', [
      ['none', '特にない'], ['self', '自分の作業方法を改善した'], ['manual', 'マニュアルや手順書を作成した'], ['tool', 'Excelやツールを使って効率化した'], ['team', 'チーム全体の業務を改善した'], ['numbers', '改善効果を数字で説明できる']
    ])
  ]
};

const SALES_JOBS = new Set(['realestate', 'doorSales', 'hrSales', 'reuseSales', 'otherSales']);
const LICENSED_JOBS = new Set(['nurse', 'teacher']);
const DIGITAL_JOBS = new Set(['engineer', 'marketing']);
