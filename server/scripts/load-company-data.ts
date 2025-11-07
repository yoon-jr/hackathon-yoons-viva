import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../db';
import { brands, products, annualSales } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SalesDataItem {
  제품명: string;
  브랜드: string | null;
  "2020년": number;
  "2021년": number;
  "2022년": number;
  "2023년": number;
  "2024년": number;
}

async function loadCompanyData() {
  console.log('[Data Loader] Starting company data load...');
  
  try {
    // Read JSON file
    const dataPath = join(process.cwd(), 'server', 'data', 'company_sales.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    const salesData: SalesDataItem[] = JSON.parse(rawData);
    
    console.log(`[Data Loader] Loaded ${salesData.length} records from JSON`);
    
    // Track unique brands
    const brandMap = new Map<string, string>(); // brandName -> brandId
    
    // Process data
    let brandCount = 0;
    let productCount = 0;
    let salesCount = 0;
    
    for (const item of salesData) {
      // Skip total sales row
      if (item.제품명 === '총매출' || !item.브랜드) continue;
      
      const brandName = item.브랜드.trim();
      const productName = item.제품명.trim();
      
      // Create or get brand
      let brandId = brandMap.get(brandName);
      if (!brandId) {
        const existingBrand = await db
          .select()
          .from(brands)
          .where(eq(brands.name, brandName))
          .limit(1);
        
        if (existingBrand.length > 0) {
          brandId = existingBrand[0].id;
        } else {
          const [newBrand] = await db
            .insert(brands)
            .values({ name: brandName })
            .returning();
          brandId = newBrand.id;
          brandCount++;
        }
        brandMap.set(brandName, brandId);
      }
      
      // Create product
      const [product] = await db
        .insert(products)
        .values({
          name: productName,
          brandId,
          brandName,
          category: inferCategory(productName),
        })
        .returning();
      productCount++;
      
      // Create annual sales records
      const years = ['2020년', '2021년', '2022년', '2023년', '2024년'] as const;
      for (const yearKey of years) {
        const salesValue = item[yearKey];
        if (salesValue !== undefined && salesValue !== null) {
          const year = yearKey.replace('년', '');
          await db.insert(annualSales).values({
            productId: product.id,
            year,
            sales: salesValue.toString(),
            salesNumeric: salesValue.toString(),
          });
          salesCount++;
        }
      }
    }
    
    console.log('[Data Loader] ✓ Data load complete:');
    console.log(`  - Brands created: ${brandCount}`);
    console.log(`  - Products created: ${productCount}`);
    console.log(`  - Sales records created: ${salesCount}`);
    
  } catch (error) {
    console.error('[Data Loader] ✗ Error loading data:', error);
    throw error;
  }
}

// Infer category from product name
function inferCategory(productName: string): string {
  if (productName.includes('파이') || productName.includes('쉘') || productName.includes('하쉬')) {
    return '파이';
  }
  if (productName.includes('칩') || productName.includes('깡') || productName.includes('스낵')) {
    return '스낵';
  }
  if (productName.includes('초코') || productName.includes('빼빼로') || productName.includes('가나')) {
    return '초코';
  }
  if (productName.includes('쿠키') || productName.includes('다스') || productName.includes('오레오')) {
    return '쿠키';
  }
  if (productName.includes('캔디') || productName.includes('사탕')) {
    return '사탕';
  }
  return '과자';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadCompanyData()
    .then(() => {
      console.log('[Data Loader] Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Data Loader] Script failed:', error);
      process.exit(1);
    });
}

export { loadCompanyData };
