// 역바이럴 마케팅 플랫폼 프롬프트 엔지니어링

interface ProductContext {
  productName: string;
  targetAge: string;
  marketingSeason: string;
  currentStatus: string;
}

interface SalesContext {
  topProducts: Array<{
    productName: string;
    rank: string;
    monthlySales: string;
    category: string;
  }>;
  trendingProducts: Array<{
    productName: string;
    trendScore: string;
    category: string;
    monthlySales: string;
  }>;
}

// 1단계: 기업-제품 분석 및 문제점 진단
export function generateDiagnosisPrompt(
  context: ProductContext,
  salesContext: SalesContext
): string {
  const topProductsList = salesContext.topProducts
    .map((p) => `${p.rank} ${p.productName} (${p.category}): ${p.monthlySales}`)
    .join("\n");

  const trendingList = salesContext.trendingProducts
    .map((p) => `${p.productName} (${p.category}): ${p.monthlySales} - ${p.trendScore}`)
    .join("\n");

  return `당신은 한국 과자 시장 전문 마케팅 컨설턴트입니다.

# 분석 대상 제품
- 제품명: ${context.productName}
- 타겟 세대: ${context.targetAge}
- 마케팅 시즌: ${context.marketingSeason}
- 현재 상태: ${context.currentStatus}

# 시장 데이터
## TOP 제품 (편의점 매출 기준)
${topProductsList}

## 트렌드 상승 제품
${trendingList}

# 요청사항
위 데이터를 바탕으로 **"${context.productName}"** 제품에 대한 심층 분석을 진행하세요.

## 분석 형식 (Markdown)

### 📊 제품 현황 진단

#### 1. 시장 내 위치 분석
- 경쟁 제품 대비 매출 수준
- 카테고리 내 포지셔닝
- 브랜드 인지도 추정

#### 2. 문제점 진단
- **매출 하락 원인 (해당시)**: 시기와 원인 분석
- **경쟁 제품과의 차별점 부족**: 상위권 제품 대비 어떤 점이 부족한가
- **타겟층 불일치**: 현재 ${context.targetAge} 세대 타겟팅의 적절성

#### 3. 기회 요소
- 활용 가능한 시장 트렌드
- 레트로(뉴트로) 마케팅 가능성
- ${context.marketingSeason} 시즌 마케팅 기회

### 💡 마케팅 방향성 제안

다음 4가지 카테고리로 마케팅 전략을 제시하세요:

1. **시즌 마케팅** (예: 빼빼로데이, 수능 시즌)
2. **콜라보레이션** (예: 아티스트, 브랜드 협업)
3. **네이밍/패키징 혁신** (예: 칸쵸 이름 넣기)
4. **굿즈/경험 마케팅** (예: 가나초콜릿 바나나우유 콜라보)

**중요**: KPI나 예산 같은 구체적 수치는 제외하고, 참신하고 바이럴 가능성 높은 아이디어에 집중하세요.

응답은 읽기 쉽게 마크다운 형식으로 작성하세요.`;
}

// 2단계: 카테고리별 마케팅 후보 제시
export function generateCandidatePrompt(
  context: ProductContext,
  conversationSummary: string
): string {
  return `# 마케팅 전략 후보 생성

이전 분석을 바탕으로 "${context.productName}"를 위한 구체적인 마케팅 전략 후보를 제시하세요.

## 출력 형식

각 카테고리별로 **1개씩** 가장 유망한 전략을 제시하세요:

### 🎯 1. 시즌 마케팅
**전략명**: [짧고 임팩트있는 이름]
**핵심 아이디어**: [1-2문장으로 핵심만]
**타겟 세대**: ${context.targetAge}
**기대 효과**: [바이럴 포인트]

---

### 🤝 2. 콜라보레이션
**전략명**: [짧고 임팩트있는 이름]
**핵심 아이디어**: [1-2문장으로 핵심만]
**타겟 세대**: ${context.targetAge}
**기대 효과**: [바이럴 포인트]

---

### ✨ 3. 네이밍/패키징
**전략명**: [짧고 임팩트있는 이름]
**핵심 아이디어**: [1-2문장으로 핵심만]
**타겟 세대**: ${context.targetAge}
**기대 효과**: [바이럴 포인트]

---

### 🎁 4. 굿즈/경험
**전략명**: [짧고 임팩트있는 이름]
**핵심 아이디어**: [1-2문장으로 핵심만]
**타겟 세대**: ${context.targetAge}
**기대 효과**: [바이럴 포인트]

---

**참고**: 
- 각 전략은 명확히 구분되어야 합니다
- 참신하고 실행 가능한 아이디어에 집중
- KPI, 예산 등 구체적 수치는 제외`;
}

// 3단계: 선택된 전략의 상세 실행 방안 생성
export function generateDetailedStrategyPrompt(
  context: ProductContext,
  strategyType: "시즌" | "콜라보" | "네이밍" | "굿즈",
  strategyTitle: string
): string {
  const categoryMap = {
    시즌: "시즌마케팅",
    콜라보: "콜라보",
    네이밍: "네이밍",
    굿즈: "굿즈",
  };

  return `# "${strategyTitle}" 상세 실행 방안

사용자가 **"${strategyTitle}"** 전략을 승인했습니다. 이제 구체적인 실행 방안을 제시하세요.

## 제품 정보
- 제품명: ${context.productName}
- 카테고리: ${categoryMap[strategyType]}
- 타겟 세대: ${context.targetAge}

## 출력 형식 (JSON)

반드시 다음 JSON 형식으로 응답하세요:

\`\`\`json
{
  "type": "${categoryMap[strategyType]}",
  "title": "${strategyTitle}",
  "description": "이 전략의 핵심을 2-3문장으로 요약",
  "details": "### 실행 단계\\n\\n1. **1단계**: 구체적 액션\\n2. **2단계**: 구체적 액션\\n3. **3단계**: 구체적 액션\\n\\n### 예상 결과\\n\\n- 바이럴 확산 경로\\n- SNS 반응 예상\\n- 브랜드 이미지 개선",
  "hashtags": "#${context.productName} #ViVa #뉴트로 #관련해시태그1 #관련해시태그2"
}
\`\`\`

**중요 사항**:
1. details는 마크다운 형식으로 작성
2. 실행 단계는 3-5단계로 구체화
3. 예상 결과는 정량적 KPI 없이 정성적 효과 중심
4. 해시태그는 5-7개 정도 제시`;
}

// 초기 전략 카드 생성 프롬프트 (인사 메시지 대체)
export function generateStrategyCardsPrompt(
  context: ProductContext,
  salesContext: SalesContext,
  marketDiagnosis?: any | null
): string {
  const topProductsList = salesContext.topProducts
    .map((p) => `${p.rank} ${p.productName} (${p.category}): ${p.monthlySales}`)
    .join("\n");

  // Add market diagnosis insights if available
  let diagnosisSection = "";
  if (marketDiagnosis && marketDiagnosis.results && marketDiagnosis.results.length > 0) {
    const topInsights = marketDiagnosis.results
      .slice(0, 8)
      .map((r: any, idx: number) => `${idx + 1}. ${r.title}: ${r.content.substring(0, 150)}...`)
      .join("\n");
    
    diagnosisSection = `\n# 실시간 시장 조사 결과 (Tavily)\n총 ${marketDiagnosis.results.length}개의 최신 시장 정보 수집:\n${topInsights}\n`;
  }

  return `당신은 한국 과자 시장 전문 마케팅 컨설턴트입니다.

# 분석 대상 제품
- 제품명: ${context.productName}
- 타겟 세대: ${context.targetAge}
- 마케팅 시즌: ${context.marketingSeason}
- 현재 상태: ${context.currentStatus}

# 시장 TOP 제품
${topProductsList}
${diagnosisSection}

# 요청사항
"${context.productName}"의 리브랜딩 마케팅을 위한 **4가지 핵심 전략 카드**를 생성하세요.
각 카드는 카테고리별로 가장 임팩트 있는 아이디어를 **간단명료하게** 제시해야 합니다.
${marketDiagnosis ? "**위의 실시간 시장 조사 결과를 적극 반영하여** 최신 트렌드에 맞는 전략을 제안하세요." : ""}

## 출력 형식 (JSON)

반드시 다음 JSON 배열 형식으로 응답하세요:

\`\`\`json
[
  {
    "category": "시즌마케팅",
    "icon": "🎯",
    "title": "[짧고 임팩트 있는 전략명]",
    "summary": "[1-2문장으로 핵심 아이디어 요약]",
    "viralPoint": "[바이럴 포인트 1문장]"
  },
  {
    "category": "콜라보",
    "icon": "🤝",
    "title": "[짧고 임팩트 있는 전략명]",
    "summary": "[1-2문장으로 핵심 아이디어 요약]",
    "viralPoint": "[바이럴 포인트 1문장]"
  },
  {
    "category": "네이밍",
    "icon": "✨",
    "title": "[짧고 임팩트 있는 전략명]",
    "summary": "[1-2문장으로 핵심 아이디어 요약]",
    "viralPoint": "[바이럴 포인트 1문장]"
  },
  {
    "category": "굿즈",
    "icon": "🎁",
    "title": "[짧고 임팩트 있는 전략명]",
    "summary": "[1-2문장으로 핵심 아이디어 요약]",
    "viralPoint": "[바이럴 포인트 1문장]"
  }
]
\`\`\`

**중요 사항**:
1. 각 전략은 명확히 구분되어야 합니다
2. title은 10자 이내로 간결하게
3. summary는 핵심만 2문장 이내
4. viralPoint는 SNS 확산 포인트 1문장
5. ${context.targetAge} 세대 타겟에 최적화된 아이디어`;
}

// 일반 대화 프롬프트
export function generateConversationPrompt(
  context: ProductContext,
  salesContext: SalesContext
): string {
  return `당신은 한국 과자 마케팅 전문 AI 컨설턴트입니다.

# 컨설팅 대상
- 제품명: ${context.productName}
- 타겟 세대: ${context.targetAge}
- 시즌: ${context.marketingSeason}
- 현재 상태: ${context.currentStatus}

사용자와 자연스럽게 대화하면서 마케팅 인사이트를 제공하세요.
응답은 간결하고 읽기 쉽게 작성하세요.

**말투 가이드**:
- 전문적이면서도 친근하게
- 마크다운으로 구조화
- 핵심만 간단명료하게
- 불필요한 인사말 반복 금지`;
}
