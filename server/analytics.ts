import { db } from './db';
import { brands, products, annualSales } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface ProductTrend {
  productId: string;
  productName: string;
  brandName: string;
  category: string | null;
  sales2020: number;
  sales2021: number;
  sales2022: number;
  sales2023: number;
  sales2024: number;
  cagr: number; // Compound Annual Growth Rate
  yoyChange: number; // Year-over-year change (2023 to 2024)
  totalSales: number;
  trendLabel: '급상승' | '상승' | '안정' | '하락' | '급하락';
}

export interface BrandAnalytics {
  brandId: string;
  brandName: string;
  totalSales2024: number;
  totalSales2020: number;
  productCount: number;
  cagr: number;
  marketShare: number; // % of total market
}

export interface MarketInsights {
  totalMarketSize2024: number;
  totalMarketSize2020: number;
  marketCAGR: number;
  topGrowingProducts: ProductTrend[];
  topDecliningProducts: ProductTrend[];
  topBrands: BrandAnalytics[];
  anomalies: ProductTrend[]; // Products with >10% drop or spike
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue === 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate YoY change percentage
 */
function calculateYoY(previousYear: number, currentYear: number): number {
  if (previousYear === 0) return 0;
  return ((currentYear - previousYear) / previousYear) * 100;
}

/**
 * Categorize trend based on CAGR
 */
function categorizeTrend(cagr: number): '급상승' | '상승' | '안정' | '하락' | '급하락' {
  if (cagr > 10) return '급상승';
  if (cagr > 2) return '상승';
  if (cagr > -2) return '안정';
  if (cagr > -10) return '하락';
  return '급하락';
}

/**
 * Get all product trends with analytics (optimized with batch processing)
 */
export async function getProductTrends(): Promise<ProductTrend[]> {
  // Fetch all products and their annual sales in parallel
  const [allProducts, allSalesRecords] = await Promise.all([
    db.select({
      id: products.id,
      name: products.name,
      brandName: products.brandName,
      category: products.category,
    }).from(products),
    db.select().from(annualSales),
  ]);

  // Group sales by product ID for O(1) lookup
  const salesByProduct = new Map<string, Record<string, number>>();
  for (const record of allSalesRecords) {
    if (!salesByProduct.has(record.productId)) {
      salesByProduct.set(record.productId, {});
    }
    const productSales = salesByProduct.get(record.productId)!;
    productSales[record.year] = parseFloat(record.salesNumeric || '0');
  }

  // Calculate trends for all products
  const trends: ProductTrend[] = allProducts.map((product) => {
    const salesByYear = salesByProduct.get(product.id) || {};
    
    const sales2020 = salesByYear['2020'] || 0;
    const sales2021 = salesByYear['2021'] || 0;
    const sales2022 = salesByYear['2022'] || 0;
    const sales2023 = salesByYear['2023'] || 0;
    const sales2024 = salesByYear['2024'] || 0;

    const cagr = calculateCAGR(sales2020, sales2024, 4);
    const yoyChange = calculateYoY(sales2023, sales2024);
    const totalSales = sales2020 + sales2021 + sales2022 + sales2023 + sales2024;

    return {
      productId: product.id,
      productName: product.name,
      brandName: product.brandName || '알 수 없음',
      category: product.category,
      sales2020,
      sales2021,
      sales2022,
      sales2023,
      sales2024,
      cagr,
      yoyChange,
      totalSales,
      trendLabel: categorizeTrend(cagr),
    };
  });

  return trends;
}

/**
 * Get brand-level analytics (optimized with batch processing)
 */
export async function getBrandAnalytics(): Promise<BrandAnalytics[]> {
  // Fetch all data in parallel
  const [allBrands, allProducts, allSalesRecords] = await Promise.all([
    db.select().from(brands),
    db.select().from(products),
    db.select().from(annualSales),
  ]);

  // Group sales by product ID
  const salesByProduct = new Map<string, Record<string, number>>();
  for (const record of allSalesRecords) {
    if (!salesByProduct.has(record.productId)) {
      salesByProduct.set(record.productId, {});
    }
    const productSales = salesByProduct.get(record.productId)!;
    productSales[record.year] = parseFloat(record.salesNumeric || '0');
  }

  // Group products by brand
  const productsByBrand = new Map<string, typeof allProducts>();
  for (const product of allProducts) {
    if (!product.brandId) continue;
    if (!productsByBrand.has(product.brandId)) {
      productsByBrand.set(product.brandId, []);
    }
    productsByBrand.get(product.brandId)!.push(product);
  }

  let totalMarket2024 = 0;
  const brandAnalytics: BrandAnalytics[] = allBrands.map((brand) => {
    const brandProducts = productsByBrand.get(brand.id) || [];
    
    let totalSales2024 = 0;
    let totalSales2020 = 0;

    for (const product of brandProducts) {
      const salesByYear = salesByProduct.get(product.id) || {};
      totalSales2024 += salesByYear['2024'] || 0;
      totalSales2020 += salesByYear['2020'] || 0;
    }

    const cagr = calculateCAGR(totalSales2020, totalSales2024, 4);
    totalMarket2024 += totalSales2024;

    return {
      brandId: brand.id,
      brandName: brand.name,
      totalSales2024,
      totalSales2020,
      productCount: brandProducts.length,
      cagr,
      marketShare: 0, // Will be calculated below
    };
  });

  // Calculate market share
  brandAnalytics.forEach((brand) => {
    brand.marketShare = totalMarket2024 > 0 ? (brand.totalSales2024 / totalMarket2024) * 100 : 0;
  });

  // Sort by market share
  return brandAnalytics.sort((a, b) => b.totalSales2024 - a.totalSales2024);
}

/**
 * Get comprehensive market insights
 */
export async function getMarketInsights(): Promise<MarketInsights> {
  const productTrends = await getProductTrends();
  const brandAnalytics = await getBrandAnalytics();

  const totalMarketSize2024 = productTrends.reduce((sum, p) => sum + p.sales2024, 0);
  const totalMarketSize2020 = productTrends.reduce((sum, p) => sum + p.sales2020, 0);
  const marketCAGR = calculateCAGR(totalMarketSize2020, totalMarketSize2024, 4);

  // Top growing (by CAGR)
  const topGrowingProducts = productTrends
    .filter((p) => p.sales2020 > 0 && p.sales2024 > 0)
    .sort((a, b) => b.cagr - a.cagr)
    .slice(0, 10);

  // Top declining (by CAGR)
  const topDecliningProducts = productTrends
    .filter((p) => p.sales2020 > 0 && p.sales2024 > 0)
    .sort((a, b) => a.cagr - b.cagr)
    .slice(0, 10);

  // Anomalies (>10% YoY change)
  const anomalies = productTrends.filter(
    (p) => Math.abs(p.yoyChange) > 10 && p.sales2023 > 1000
  );

  return {
    totalMarketSize2024,
    totalMarketSize2020,
    marketCAGR,
    topGrowingProducts,
    topDecliningProducts,
    topBrands: brandAnalytics.slice(0, 10),
    anomalies,
  };
}

/**
 * Get AI-powered insights summary
 */
export async function generateInsightsSummary(insights: MarketInsights): Promise<string> {
  const { totalMarketSize2024, marketCAGR, topGrowingProducts, topDecliningProducts, topBrands } = insights;

  const summary = `
## 시장 전체 분석

- **전체 시장 규모 (2024)**: ${(totalMarketSize2024 / 10000).toFixed(1)}억원
- **연평균 성장률 (CAGR)**: ${marketCAGR.toFixed(2)}%

### 주요 인사이트

**🔥 급성장 제품 TOP 3:**
${topGrowingProducts.slice(0, 3).map((p, i) => 
  `${i + 1}. ${p.productName} (${p.brandName}) - CAGR ${p.cagr.toFixed(1)}%`
).join('\n')}

**📉 하락 제품 TOP 3:**
${topDecliningProducts.slice(0, 3).map((p, i) => 
  `${i + 1}. ${p.productName} (${p.brandName}) - CAGR ${p.cagr.toFixed(1)}%`
).join('\n')}

**🏆 브랜드 점유율 TOP 5:**
${topBrands.slice(0, 5).map((b, i) => 
  `${i + 1}. ${b.brandName} - ${b.marketShare.toFixed(1)}% (${b.productCount}개 제품)`
).join('\n')}
  `.trim();

  return summary;
}
