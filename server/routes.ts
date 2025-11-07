import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertMessageSchema } from "@shared/schema";
import { generateMarketingResponse, generateMarketingStrategies, generateMarketingImages } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      
      // Create initial AI greeting message
      const greeting = await generateMarketingResponse(
        [],
        {
          productName: project.productName,
          targetAge: project.targetAge,
          marketingSeason: project.marketingSeason,
          currentStatus: project.currentStatus,
        }
      );
      
      await storage.createMessage({
        projectId: project.id,
        role: "assistant",
        content: greeting,
      });
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get messages for a project
  app.get("/api/messages/:projectId", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Send a chat message and get AI response
  app.post("/api/chat/:projectId", async (req, res) => {
    try {
      const { content } = z.object({ content: z.string() }).parse(req.body);
      const projectId = req.params.projectId;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Save user message
      await storage.createMessage({
        projectId,
        role: "user",
        content,
      });

      // Get conversation history
      const messages = await storage.getMessages(projectId);
      const conversationHistory = messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Generate AI response
      const aiResponse = await generateMarketingResponse(
        conversationHistory,
        {
          productName: project.productName,
          targetAge: project.targetAge,
          marketingSeason: project.marketingSeason,
          currentStatus: project.currentStatus,
        }
      );

      // Save AI message
      await storage.createMessage({
        projectId,
        role: "assistant",
        content: aiResponse,
      });

      // Return updated messages
      const updatedMessages = await storage.getMessages(projectId);
      res.json({ messages: updatedMessages });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Generate marketing strategies with images
  app.post("/api/strategies/generate/:projectId", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get conversation summary
      const messages = await storage.getMessages(projectId);
      const conversationText = messages
        .slice(-10) // Last 10 messages
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");

      // Generate strategies
      const strategies = await generateMarketingStrategies(
        {
          productName: project.productName,
          targetAge: project.targetAge,
          marketingSeason: project.marketingSeason,
          currentStatus: project.currentStatus,
        },
        conversationText
      );

      // Generate images for all strategies in parallel
      const imageRequests = strategies.map(s => ({
        productName: project.productName,
        strategyTitle: s.title,
        strategyDescription: s.description,
      }));

      const imageBuffers = await generateMarketingImages(imageRequests);

      // Save strategies with image data URLs
      const savedStrategies = await Promise.all(
        strategies.map(async (strategy, index) => {
          const imageBuffer = imageBuffers[index];
          const imageDataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
          
          return await storage.createStrategy({
            projectId,
            type: strategy.type,
            title: strategy.title,
            description: strategy.description,
            imageUrl: imageDataUrl,
            details: strategy.details,
            hashtags: strategy.hashtags,
          });
        })
      );

      res.json({ strategies: savedStrategies });
    } catch (error) {
      console.error("Error generating strategies:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get strategies for a project
  app.get("/api/strategies/:projectId", async (req, res) => {
    try {
      const strategies = await storage.getStrategies(req.params.projectId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
