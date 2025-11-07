import {
  type Project,
  type InsertProject,
  type Message,
  type InsertMessage,
  type Strategy,
  type InsertStrategy,
  type ProductSales,
  type InsertProductSales,
  projects,
  messages,
  strategies,
  productSales,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProjectStage(id: string, stage: string): Promise<Project | undefined>;
  
  // Messages
  getMessages(projectId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Strategies
  getStrategies(projectId: string): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  createStrategies(strategies: InsertStrategy[]): Promise<Strategy[]>;
  
  // Product Sales
  getProductSales(category?: string): Promise<ProductSales[]>;
  getTopProducts(limit: number): Promise<ProductSales[]>;
  getTrendingProducts(): Promise<ProductSales[]>;
  createProductSales(sales: InsertProductSales): Promise<ProductSales>;
  bulkCreateProductSales(salesList: InsertProductSales[]): Promise<ProductSales[]>;
}

export class PostgresStorage implements IStorage {
  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values({
      ...insertProject,
      conversationStage: "greeting",
    }).returning();
    return result[0];
  }

  async updateProjectStage(id: string, stage: string): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set({ conversationStage: stage })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  // Messages
  async getMessages(projectId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  // Strategies
  async getStrategies(projectId: string): Promise<Strategy[]> {
    return await db
      .select()
      .from(strategies)
      .where(eq(strategies.projectId, projectId))
      .orderBy(desc(strategies.createdAt));
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const result = await db.insert(strategies).values(insertStrategy).returning();
    return result[0];
  }

  async createStrategies(insertStrategies: InsertStrategy[]): Promise<Strategy[]> {
    const result = await db.insert(strategies).values(insertStrategies).returning();
    return result;
  }

  // Product Sales
  async getProductSales(category?: string): Promise<ProductSales[]> {
    if (category) {
      return await db
        .select()
        .from(productSales)
        .where(eq(productSales.category, category))
        .orderBy(desc(productSales.recordedAt));
    }
    return await db
      .select()
      .from(productSales)
      .orderBy(desc(productSales.recordedAt))
      .limit(50);
  }

  async getTopProducts(limit: number): Promise<ProductSales[]> {
    const allProducts = await db.select().from(productSales);
    
    return allProducts
      .sort((a, b) => {
        const rankA = parseInt(a.rank?.replace('위', '') || '999');
        const rankB = parseInt(b.rank?.replace('위', '') || '999');
        return rankA - rankB;
      })
      .slice(0, limit);
  }

  async getTrendingProducts(): Promise<ProductSales[]> {
    return await db
      .select()
      .from(productSales)
      .where(eq(productSales.trendScore, "상승"))
      .orderBy(desc(productSales.recordedAt))
      .limit(20);
  }

  async createProductSales(insertSales: InsertProductSales): Promise<ProductSales> {
    const result = await db.insert(productSales).values(insertSales).returning();
    return result[0];
  }

  async bulkCreateProductSales(salesList: InsertProductSales[]): Promise<ProductSales[]> {
    const result = await db.insert(productSales).values(salesList).returning();
    return result;
  }
}

export const storage = new PostgresStorage();
