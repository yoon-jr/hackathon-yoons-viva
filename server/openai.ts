import OpenAI from "openai";
import { Buffer } from "node:buffer";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";
import * as prompts from "./prompts";

// Using OpenAI's API directly with user-provided API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

  console.log("[OpenAI] Starting generateMarketingResponse");
  console.log("[OpenAI] Environment:", {
    hasAPIKey: !!process.env.OPENAI_API_KEY,
  });
  
  return await pRetry(
    async () => {
      try {
        console.log("[OpenAI] Calling chat.completions.create...");
        const response = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_completion_tokens: 8192,
        });
        console.log("[OpenAI] Response received:", {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length,
          hasContent: !!response.choices?.[0]?.message?.content,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
          console.error("[OpenAI] No content in response:", response);
          return "죄송합니다. 응답을 생성할 수 없습니다.";
        }
        return content;
      } catch (error: any) {
        console.error("[OpenAI] Error in chat completion:", {
          message: error?.message,
          status: error?.status,
          type: error?.type,
          stack: error?.stack,
        });
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
          model: "gpt-4.1",
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
// NOTE: Image generation is disabled - returns empty buffer for placeholder
export async function generateMarketingImage(
  productName: string,
  strategyTitle: string,
  strategyDescription: string
): Promise<Buffer> {
  console.log(`[Image] Placeholder image for: ${strategyTitle} (generation disabled)`);
  
  // Return empty buffer - image generation disabled to save costs
  return Buffer.from([]);
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

// NEW: Structured conversation flow functions using prompt engineering

export async function generateStrategyCards(
  context: {
    productName: string;
    targetAge: string;
    marketingSeason: string;
    currentStatus: string;
  },
  salesContext: {
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
  },
  marketDiagnosis?: any | null
): Promise<Array<{
  category: string;
  icon: string;
  title: string;
  summary: string;
  viralPoint: string;
}>> {
  const userPrompt = prompts.generateStrategyCardsPrompt(context, salesContext, marketDiagnosis);
  
  console.log("[StrategyCards] Generating initial strategy cards...");
  return await pRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: userPrompt }],
        max_completion_tokens: 2048,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No strategy cards content received");
      }
      
      // Extract JSON from markdown code block if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      try {
        const parsed = JSON.parse(jsonString);
        console.log("[StrategyCards] Cards generated successfully");
        return parsed;
      } catch (e) {
        console.error("[StrategyCards] Failed to parse JSON:", e);
        throw new Error("Failed to parse strategy cards JSON");
      }
    },
    { retries: 3, minTimeout: 2000, maxTimeout: 10000 }
  );
}

export async function generateGreeting(context: {
  productName: string;
  targetAge: string;
  marketingSeason: string;
  currentStatus: string;
}): Promise<string> {
  // Deprecated - will be removed
  return `안녕하세요! ${context.productName}의 역바이럴 마케팅을 시작합니다.`;
}

export async function generateDiagnosis(
  context: {
    productName: string;
    targetAge: string;
    marketingSeason: string;
    currentStatus: string;
  },
  salesContext: {
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
): Promise<string> {
  const userPrompt = prompts.generateDiagnosisPrompt(context, salesContext);
  
  console.log("[Diagnosis] Generating product analysis...");
  return await pRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: userPrompt }],
        max_completion_tokens: 4096,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No diagnosis content received");
      }
      console.log("[Diagnosis] Analysis generated successfully");
      return content;
    },
    { retries: 3, minTimeout: 2000, maxTimeout: 10000 }
  );
}

export async function generateCandidates(
  context: {
    productName: string;
    targetAge: string;
    marketingSeason: string;
    currentStatus: string;
  },
  conversationSummary: string
): Promise<string> {
  const userPrompt = prompts.generateCandidatePrompt(context, conversationSummary);
  
  console.log("[Candidates] Generating marketing candidates...");
  return await pRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: userPrompt }],
        max_completion_tokens: 4096,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No candidates content received");
      }
      console.log("[Candidates] Candidates generated successfully");
      return content;
    },
    { retries: 3, minTimeout: 2000, maxTimeout: 10000 }
  );
}

export async function generateDetailedStrategy(
  context: {
    productName: string;
    targetAge: string;
    marketingSeason: string;
    currentStatus: string;
  },
  strategyType: "시즌" | "콜라보" | "네이밍" | "굿즈",
  strategyTitle: string
): Promise<{
  type: string;
  title: string;
  description: string;
  details: string;
  hashtags: string;
}> {
  const userPrompt = prompts.generateDetailedStrategyPrompt(context, strategyType, strategyTitle);
  
  console.log(`[DetailedStrategy] Generating details for: ${strategyTitle}`);
  return await pRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: userPrompt }],
        max_completion_tokens: 2048,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No detailed strategy content received");
      }
      
      // Extract JSON from markdown code block if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      try {
        const parsed = JSON.parse(jsonString);
        console.log("[DetailedStrategy] Strategy details generated successfully");
        return parsed;
      } catch (e) {
        console.error("[DetailedStrategy] Failed to parse JSON:", e);
        throw new Error("Failed to parse strategy JSON");
      }
    },
    { retries: 3, minTimeout: 2000, maxTimeout: 10000 }
  );
}
