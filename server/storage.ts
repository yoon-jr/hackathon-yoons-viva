import {
  type Project,
  type InsertProject,
  type Message,
  type InsertMessage,
  type Strategy,
  type InsertStrategy,
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private messages: Map<string, Message>;
  private strategies: Map<string, Strategy>;

  constructor() {
    this.projects = new Map();
    this.messages = new Map();
    this.strategies = new Map();
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  // Messages
  async getMessages(projectId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.projectId === projectId)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  // Strategies
  async getStrategies(projectId: string): Promise<Strategy[]> {
    return Array.from(this.strategies.values())
      .filter((strategy) => strategy.projectId === projectId)
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = randomUUID();
    const strategy: Strategy = {
      ...insertStrategy,
      id,
      createdAt: new Date(),
    };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async createStrategies(strategies: InsertStrategy[]): Promise<Strategy[]> {
    return Promise.all(strategies.map((s) => this.createStrategy(s)));
  }
}

export const storage = new MemStorage();
