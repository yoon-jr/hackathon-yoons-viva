import { tavily } from "@tavily/core";
import pRetry from "p-retry";

// Lazy initialization of Tavily client to handle missing API keys gracefully
let tavilyClient: ReturnType<typeof tavily> | null = null;
let tavilyInitAttempted = false;

function getTavilyClient(): ReturnType<typeof tavily> | null {
  if (!tavilyInitAttempted) {
    tavilyInitAttempted = true;
    if (!process.env.TAVILY_API_KEY) {
      console.warn("[Tavily] TAVILY_API_KEY is not configured - market diagnosis will be skipped");
      return null;
    }
    try {
      tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
      console.log("[Tavily] Client initialized successfully");
    } catch (error) {
      console.error("[Tavily] Failed to initialize client:", error);
      return null;
    }
  }
  return tavilyClient;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface MarketDiagnosisData {
  queries: string[];
  results: TavilySearchResult[];
  summary: string;
}

/**
 * Generate market-specific search queries based on product context
 */
function generateMarketQueries(productContext: {
  productName: string;
  targetAge: string;
  marketingSeason: string;
  currentStatus: string;
}): string[] {
  const baseQueries = [
    `${productContext.productName} 과자 시장 분석`,
    `${productContext.productName} 마케팅 사례`,
    "편의점 과자 트렌드 2024 2025",
    "MZ세대 과자 소비 특징",
    "과자 콜라보 마케팅 성공 사례",
  ];

  // Add age-specific queries
  if (productContext.targetAge === "10대") {
    baseQueries.push("10대 과자 유행 트렌드", "중고등학생 과자 선호도");
  } else if (productContext.targetAge === "20대") {
    baseQueries.push("20대 과자 소비 패턴", "대학생 간식 트렌드");
  } else if (productContext.targetAge === "30대") {
    baseQueries.push("30대 프리미엄 과자 시장", "어른을 위한 과자 트렌드");
  }

  // Add season-specific queries
  if (productContext.marketingSeason !== "기타") {
    baseQueries.push(`${productContext.marketingSeason} 과자 마케팅`);
  }

  // Add status-specific queries
  if (productContext.currentStatus === "실패" || productContext.currentStatus === "비바이럴") {
    baseQueries.push("과자 역주행 마케팅 성공 사례", "뉴트로 스낵 마케팅");
  }

  return baseQueries;
}

/**
 * Search Tavily with a single query
 */
async function searchSingleQuery(query: string): Promise<TavilySearchResult[]> {
  console.log(`[Tavily] Searching: "${query}"`);
  
  const client = getTavilyClient();
  if (!client) {
    return [];
  }
  
  return await pRetry(
    async () => {
      try {
        const response = await client.search(query, {
          searchDepth: "advanced",
          maxResults: 3,
          includeAnswer: false,
          includeRawContent: false,
        });

        const results = response.results || [];
        console.log(`[Tavily] Found ${results.length} results for "${query}"`);

        return results.map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          content: r.content || "",
          score: r.score,
        }));
      } catch (error: any) {
        console.error(`[Tavily] Error searching "${query}":`, error.message);
        throw error;
      }
    },
    {
      retries: 2,
      minTimeout: 1000,
      maxTimeout: 3000,
    }
  );
}

/**
 * Perform market diagnosis using Tavily search
 */
export async function performMarketDiagnosis(productContext: {
  productName: string;
  targetAge: string;
  marketingSeason: string;
  currentStatus: string;
}): Promise<MarketDiagnosisData> {
  console.log("[Tavily] Starting market diagnosis for:", productContext.productName);

  // Check if Tavily client is available
  const client = getTavilyClient();
  if (!client) {
    console.log("[Tavily] Client not available - skipping market diagnosis");
    return {
      queries: [],
      results: [],
      summary: `${productContext.productName}의 역바이럴 마케팅 전략을 준비합니다.`,
    };
  }

  const queries = generateMarketQueries(productContext);
  const allResults: TavilySearchResult[] = [];

  // Search with rate limiting (1 second between queries)
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    
    try {
      const results = await searchSingleQuery(query);
      allResults.push(...results);
      
      // Wait 1 second between queries to avoid rate limiting
      if (i < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`[Tavily] Failed to search "${query}", continuing...`);
      // Continue with other queries even if one fails
    }
  }

  console.log(`[Tavily] Market diagnosis complete: ${allResults.length} results from ${queries.length} queries`);

  // Generate summary of findings
  const summary = generateDiagnosisSummary(allResults, productContext);

  return {
    queries,
    results: allResults,
    summary,
  };
}

/**
 * Generate a summary of market diagnosis results
 */
function generateDiagnosisSummary(
  results: TavilySearchResult[],
  productContext: { productName: string; targetAge: string }
): string {
  if (results.length === 0) {
    return `${productContext.productName}에 대한 시장 정보를 수집했습니다. ${productContext.targetAge} 타겟을 위한 전략을 준비합니다.`;
  }

  // Extract key trends from top results
  const topResults = results
    .filter(r => r.score && r.score > 0.7)
    .slice(0, 5);

  if (topResults.length === 0) {
    return `${results.length}개의 시장 데이터를 수집했습니다. 최신 트렌드와 성공 사례를 바탕으로 전략을 생성합니다.`;
  }

  const keyTopics = topResults
    .map(r => r.title)
    .join(", ")
    .substring(0, 200);

  return `시장 분석 완료: ${results.length}개 데이터 수집. 주요 트렌드: ${keyTopics}...`;
}

/**
 * Format market diagnosis results for AI prompt
 */
export function formatDiagnosisForPrompt(diagnosis: MarketDiagnosisData): string {
  if (diagnosis.results.length === 0) {
    return "시장 데이터: 일반적인 과자 시장 트렌드를 기반으로 분석합니다.";
  }

  const topResults = diagnosis.results
    .filter(r => r.score && r.score > 0.7)
    .slice(0, 10);

  const formattedResults = topResults
    .map((r, idx) => {
      return `[${idx + 1}] ${r.title}\n${r.content.substring(0, 200)}...`;
    })
    .join("\n\n");

  return `# 실시간 시장 조사 결과\n\n${diagnosis.summary}\n\n## 주요 발견 사항:\n\n${formattedResults}`;
}
