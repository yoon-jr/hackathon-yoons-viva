import OpenAI from "openai";
import { Buffer } from "node:buffer";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Generate marketing chat response
export async function generateMarketingResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  projectContext: {
    productName: string;
    targetAge: string;
    marketingSeason: string;
    currentStatus: string;
  }
): Promise<string> {
  const systemPrompt = `당신은 한국의 과자/식품 마케팅 전문가입니다. 사용자가 "${projectContext.productName}"라는 제품을 리브랜딩하고 바이럴시키려고 합니다.

타겟: ${projectContext.targetAge}
시기: ${projectContext.marketingSeason}
현재 상태: ${projectContext.currentStatus}

연령별 전략:
- 10대: 갓성비, 인플루언서/연예인 콜라보, 챌린지형 콘텐츠
- 20대: 인스타그래머블, 해외 트렌드 접목, 한정판 전략
- 30대: 프리미엄화, 브랜드 스토리, 고급 패키징

시즌별 포인트:
- 수능시즌: 응원 메시지, 행운의 아이템
- 여름: 시원한 이미지, 냉동 제품
- 연말: 선물세트, 한정판

친근하고 열정적으로 대화하되 전문적인 인사이트를 제공하세요. 구체적인 사례와 실행 가능한 아이디어를 제시하세요.`;

  return await pRetry(
    async () => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_completion_tokens: 2048,
        });
        return response.choices[0]?.message?.content || "죄송합니다. 응답을 생성할 수 없습니다.";
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2,
    }
  );
}

// Generate marketing strategies in batch
export async function generateMarketingStrategies(
  projectContext: {
    productName: string;
    targetAge: string;
    marketingSeason: string;
    currentStatus: string;
  },
  conversationSummary: string,
  salesData?: {
    topProducts: Array<{ productName: string; rank: string; monthlySales: string; category: string }>;
    trendingProducts: Array<{ productName: string; trendScore: string; category: string; monthlySales: string }>;
  }
): Promise<Array<{
  type: string;
  title: string;
  description: string;
  details: string;
  hashtags: string;
}>> {
  
  // Always include sales data context
  let salesContext = "";
  if (salesData) {
    const topList = salesData.topProducts.length > 0
      ? salesData.topProducts.slice(0, 5).map(p => `${p.rank} ${p.productName} (${p.category}, ${p.monthlySales})`).join(", ")
      : "데이터 없음";
    
    const trendingList = salesData.trendingProducts.length > 0
      ? salesData.trendingProducts.slice(0, 5).map(p => `${p.productName} (${p.category}, 판매량: ${p.monthlySales})`).join(", ")
      : "데이터 없음";
    
    salesContext = `

📊 국내 편의점 과자 판매 데이터 (최신):
- 인기 TOP 5: ${topList}
- 상승 트렌드: ${trendingList}

이 데이터를 참고하여 시장 트렌드에 맞는 현실적인 전략을 제시하세요.`;
  }

  const prompt = `${projectContext.productName}의 역바이럴 마케팅 전략을 4가지 타입으로 생성해주세요.

제품 정보:
- 타겟: ${projectContext.targetAge}
- 시기: ${projectContext.marketingSeason}
- 현재 상태: ${projectContext.currentStatus}

대화 요약: ${conversationSummary}${salesContext}

다음 4가지 타입의 전략을 JSON 객체로 반환하세요. "strategies" 키 아래에 배열을 넣어주세요:

{
  "strategies": [
    {
      "type": "콜라보",
      "title": "전략 제목 (짧고 임팩트있게)",
      "description": "한 문장 요약",
      "details": "구체적인 실행 방법 (3-5개 스텝)",
      "hashtags": "#해시태그1 #해시태그2 #해시태그3"
    },
    ... (네이밍, 캠페인, 시즌마케팅 전략 추가)
  ]
}

반드시 위 JSON 형식으로만 반환하세요.`;

  return await pRetry(
    async () => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_completion_tokens: 4096,
        });
        
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        
        // Handle both array response and object with strategies key
        if (Array.isArray(parsed)) {
          return parsed;
        } else if (parsed.strategies && Array.isArray(parsed.strategies)) {
          return parsed.strategies;
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 15000,
      factor: 2,
    }
  );
}

// Generate image for marketing strategy using DALL-E
export async function generateMarketingImage(
  productName: string,
  strategyTitle: string,
  strategyDescription: string
): Promise<Buffer> {
  const prompt = `한국 과자 "${productName}"의 마케팅 비주얼 디자인. ${strategyTitle}. ${strategyDescription}. 
레트로-모던 스타일, 밝고 생동감있는 색상, 80-90년대 한국 과자 패키징 감성, 전문적이고 상업적인 품질. 제품이 돋보이도록.`;

  return await pRetry(
    async () => {
      try {
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: prompt,
          size: "1024x1024",
        });
        const base64 = response.data[0]?.b64_json ?? "";
        return Buffer.from(base64, "base64");
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 15000,
      factor: 2,
    }
  );
}

// Generate multiple images in parallel with rate limiting
export async function generateMarketingImages(
  requests: Array<{
    productName: string;
    strategyTitle: string;
    strategyDescription: string;
  }>
): Promise<Buffer[]> {
  const limit = pLimit(2); // Process up to 2 requests concurrently
  
  const imagePromises = requests.map((req) =>
    limit(() => generateMarketingImage(req.productName, req.strategyTitle, req.strategyDescription))
  );
  
  return await Promise.all(imagePromises);
}
