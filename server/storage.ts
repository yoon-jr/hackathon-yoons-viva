import {
  type Project,
  type InsertProject,
  type Message,
  type InsertMessage,
  type Strategy,
  type InsertStrategy,
  projects,
  messages,
  strategies,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Messages
  getMessages(projectId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Strategies
  getStrategies(projectId: string): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  createStrategies(strategies: InsertStrategy[]): Promise<Strategy[]>;
}

export class PostgresStorage implements IStorage {
  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(insertProject).returning();
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
}

export const storage = new PostgresStorage();
