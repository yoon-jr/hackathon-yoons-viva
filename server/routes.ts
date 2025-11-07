import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertMessageSchema } from "@shared/schema";
import { 
  generateMarketingResponse, 
  generateMarketingStrategies, 
  generateMarketingImages,
  generateGreeting,
  generateDiagnosis,
  generateCandidates,
  generateDetailedStrategy
} from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      
      // Create initial AI greeting using new prompt system
      try {
        const greeting = await generateGreeting({
          productName: project.productName,
          targetAge: project.targetAge,
          marketingSeason: project.marketingSeason,
          currentStatus: project.currentStatus,
        });
        
        await storage.createMessage({
          projectId: project.id,
          role: "assistant",
          content: greeting,
          metadata: JSON.stringify({ stage: "greeting" }),
        });
      } catch (aiError) {
        console.error("AI greeting generation failed:", aiError);
        // Fallback greeting
        await storage.createMessage({
          projectId: project.id,
          role: "assistant",
          content: `안녕하세요! ${project.productName}의 역바이럴 마케팅을 함께 시작하겠습니다.\n\n먼저 제품과 시장을 분석한 후, 맞춤 전략을 제안해드리겠습니다.\n\n**"분석 시작"**이라고 말씀해주시면 시작하겠습니다!`,
          metadata: JSON.stringify({ stage: "greeting" }),
        });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Server error" });
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

  // Send a chat message and get AI response (NEW: Stage-based flow)
  app.post("/api/chat/:projectId", async (req, res) => {
    try {
      const { content, action } = z.object({ 
        content: z.string(),
        action: z.string().optional(), // "start_diagnosis", "show_candidates", "select_strategy"
      }).parse(req.body);
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

      const currentStage = project.conversationStage || "greeting";
      console.log(`[Chat] Current stage: ${currentStage}, Action: ${action || "none"}`);

      let aiResponse: string;
      let newStage = currentStage;
      let responseMetadata: any = { stage: currentStage };

      // Determine next action based on content or explicit action
      const userIntent = action || detectUserIntent(content);

      // Generate AI response based on stage
      if (userIntent === "start_diagnosis") {
        // Stage 1: Diagnosis
        console.log("[Chat] Starting diagnosis...");
        try {
          const topProducts = await storage.getTopProducts(10);
          const trendingProducts = await storage.getTrendingProducts();
          
          const salesData = {
            topProducts: topProducts.map(p => ({
              productName: p.productName,
              rank: p.rank || "N/A",
              monthlySales: p.monthlySales,
              category: p.category,
            })),
            trendingProducts: trendingProducts.map(p => ({
              productName: p.productName,
              trendScore: p.trendScore,
              category: p.category,
              monthlySales: p.monthlySales,
            })),
          };
          
          aiResponse = await generateDiagnosis(
            {
              productName: project.productName,
              targetAge: project.targetAge,
              marketingSeason: project.marketingSeason,
              currentStatus: project.currentStatus,
            },
            salesData
          );
          
          newStage = "diagnosis";
          responseMetadata = { stage: "diagnosis" };
        } catch (error) {
          console.error("[Chat] Diagnosis generation failed:", error);
          aiResponse = "죄송합니다. 진단 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
          newStage = "greeting"; // Roll back to greeting
          responseMetadata = { stage: "greeting", error: "diagnosis_failed" };
        }
        
      } else if (userIntent === "show_candidates") {
        // Stage 2: Candidates
        console.log("[Chat] Generating candidates...");
        try {
          const messages = await storage.getMessages(projectId);
          const conversationSummary = messages
            .slice(-5)
            .map((m) => `${m.role}: ${m.content.substring(0, 200)}`)
            .join("\n");
          
          aiResponse = await generateCandidates(
            {
              productName: project.productName,
              targetAge: project.targetAge,
              marketingSeason: project.marketingSeason,
              currentStatus: project.currentStatus,
            },
            conversationSummary
          );
          
          newStage = "candidates";
          responseMetadata = { stage: "candidates" };
        } catch (error) {
          console.error("[Chat] Candidates generation failed:", error);
          aiResponse = "죄송합니다. 마케팅 후보를 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
          newStage = "diagnosis"; // Go back to diagnosis
          responseMetadata = { stage: "diagnosis", error: "candidates_failed" };
        }


        
      } else if (userIntent === "select_strategy") {
        // Stage 3: Detailed Strategy + Images
        console.log("[Chat] Generating detailed strategy with images...");
        
        const categorySelection = extractCategorySelection(content);
        if (!categorySelection) {
          aiResponse = "죄송합니다. 어떤 카테고리를 선택하실지 명확히 알려주세요.\n\n" +
            "다음 중 하나를 선택해 주세요:\n" +
            "- 시즌마케팅 (계절별 마케팅)\n" +
            "- 콜라보 (협업 마케팅)\n" +
            "- 네이밍 (제품명 리브랜딩)\n" +
            "- 굿즈 (상품 기획)";
        } else {
          console.log(`[Chat] Selected category: ${categorySelection.category}`);
          
          try {
            const messages = await storage.getMessages(projectId);
            const conversationSummary = messages
              .slice(-10)
              .map((m) => `${m.role}: ${m.content.substring(0, 300)}`)
              .join("\n");
            
            // Generate detailed strategy with error handling
            let strategyResult;
            let strategyGenerationFailed = false;
            
            try {
              strategyResult = await generateDetailedStrategy(
                {
                  productName: project.productName,
                  targetAge: project.targetAge,
                  marketingSeason: project.marketingSeason,
                  currentStatus: project.currentStatus,
                },
                categorySelection.category,
                conversationSummary
              );
              console.log("[Chat] Strategy generated successfully");
            } catch (strategyError) {
              console.error("[Chat] Strategy generation failed:", strategyError);
              strategyGenerationFailed = true;
              aiResponse = `죄송합니다. ${categorySelection.category} 전략을 생성하는 중 오류가 발생했습니다.\n\n` +
                `다시 시도해 주시거나, 다른 카테고리를 선택해 주세요.`;
              newStage = "candidates"; // Stay in candidates stage
              responseMetadata = { stage: "candidates", error: "strategy_generation_failed" };
              // Don't rethrow - continue to save message and respond
            }
            
            // Only continue with images and saving if strategy was successful
            if (!strategyGenerationFailed && strategyResult) {
              // Generate marketing images with fallback
              console.log("[Chat] Strategy generated, now generating images...");
              let images: string[] = [];
              try {
                images = await generateMarketingImages(
                  strategyResult.imagePrompts,
                  {
                    productName: project.productName,
                    category: categorySelection.category,
                  }
                );
                console.log(`[Chat] Generated ${images.length} images`);
              } catch (imageError) {
                console.error("[Chat] Image generation failed:", imageError);
                console.log("[Chat] Continuing with strategy without images");
                // Continue without images - not critical
              }
              
              // Validate images array
              const validImages = images.filter(url => url && url.length > 0);
              const primaryImageUrl = validImages.length > 0 ? validImages[0] : null;
              
              if (validImages.length === 0) {
                console.warn("[Chat] No valid images generated, saving strategy without images");
              }
              
              // Save strategy to database
              await storage.createStrategy({
                projectId,
                type: categorySelection.category as any,
                title: strategyResult.title,
                description: strategyResult.description,
                imageUrl: primaryImageUrl,
                implementation: JSON.stringify(strategyResult.implementation),
                hashtags: strategyResult.hashtags,
              });
              
              // Format response with images (if available)
              aiResponse = `# ${strategyResult.title}\n\n${strategyResult.description}\n\n` +
                `## 실행 방안\n${strategyResult.implementation.map((impl, idx) => `${idx + 1}. ${impl}`).join('\n')}\n\n` +
                `## 해시태그\n${strategyResult.hashtags.map(tag => `#${tag}`).join(' ')}`;
              
              if (validImages.length > 0) {
                aiResponse += `\n\n## 비주얼 콘셉트\n${validImages.map((url, idx) => `![이미지 ${idx + 1}](${url})`).join('\n')}`;
              } else {
                aiResponse += `\n\n## 비주얼 콘셉트\n이미지 생성 중 문제가 발생했습니다. 전략은 저장되었으니 나중에 다시 확인해 주세요.`;
              }
              
              newStage = "detailed";
              responseMetadata = { 
                stage: "detailed",
                category: categorySelection.category,
                images: validImages,
                hasImages: validImages.length > 0,
              };
            }
          } catch (error) {
            // Unexpected errors (e.g., database errors)
            console.error("[Chat] Unexpected error in detailed strategy flow:", error);
            aiResponse = "죄송합니다. 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
            newStage = "candidates";
            responseMetadata = { stage: "candidates", error: "unexpected_error" };
          }
        }
        
      } else {
        // General conversation
        console.log("[Chat] General conversation");
        try {
          const messages = await storage.getMessages(projectId);
          const conversationHistory = messages
            .filter(m => m.role !== "system")
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));
          
          aiResponse = await generateMarketingResponse(
            conversationHistory,
            {
              productName: project.productName,
              targetAge: project.targetAge,
              marketingSeason: project.marketingSeason,
              currentStatus: project.currentStatus,
            }
          );
        } catch (error) {
          console.error("[Chat] General conversation failed:", error);
          aiResponse = "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.";
          responseMetadata = { ...responseMetadata, error: "conversation_failed" };
        }
      }
      
      console.log(`[Chat] Response generated, new stage: ${newStage}`);

      // Update project stage if changed
      if (newStage !== currentStage) {
        console.log(`[Chat] Updating stage from '${currentStage}' to '${newStage}'`);
        await storage.updateProjectStage(projectId, newStage);
        console.log(`[Chat] Stage updated successfully`);
      } else {
        console.log(`[Chat] Stage unchanged: ${currentStage}`);
      }

      // Save AI message with metadata
      await storage.createMessage({
        projectId,
        role: "assistant",
        content: aiResponse,
        metadata: JSON.stringify(responseMetadata),
      });

      // Return updated messages
      const updatedMessages = await storage.getMessages(projectId);
      res.json({ messages: updatedMessages });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Server error" });
    }
  });

  // Helper function to detect user intent from message content
  function detectUserIntent(content: string): string | null {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes("분석") || lowerContent.includes("진단") || lowerContent.includes("시작")) {
      return "start_diagnosis";
    }
    
    if (lowerContent.includes("후보") || lowerContent.includes("전략 보여") || lowerContent.includes("카테고리 보여") || lowerContent.includes("아이디어 보여")) {
      return "show_candidates";
    }
    
    // Detect category selection
    if (lowerContent.includes("선택") || lowerContent.includes("결정") || lowerContent.includes("이걸로")) {
      return "select_strategy";
    }
    
    return null;
  }
  
  // Helper function to extract category info from user message
  function extractCategorySelection(content: string): { category: string; title: string } | null {
    const normalizedContent = content
      .toLowerCase()
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/[^\w가-힣]/g, ''); // Keep only Korean and alphanumeric
    
    // Detect category keywords with enhanced matching
    let category = "";
    if (normalizedContent.match(/(시즌|계절|봄|여름|가을|겨울)/)) {
      category = "시즌마케팅";
    } else if (normalizedContent.match(/(콜라보|협업|콜래버|collaboration)/)) {
      category = "콜라보";
    } else if (normalizedContent.match(/(네이밍|이름|네임|naming)/)) {
      category = "네이밍";
    } else if (normalizedContent.match(/(굿즈|상품|goods|제품|머천다이즈)/)) {
      category = "굿즈";
    }
    
    if (category) {
      console.log(`[Chat] Extracted category: "${category}" from "${content}"`);
    } else {
      console.log(`[Chat] Failed to extract category from "${content}"`);
    }
    
    // Extract title if available
    const title = content.length > 20 ? content.substring(0, 50) : category;
    
    return category ? { category, title } : null;
  }

  // Product Sales API - Get sales data
  app.get("/api/sales", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const salesData = await storage.getProductSales(category);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get top products by rank
  app.get("/api/sales/top", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topProducts = await storage.getTopProducts(limit);
      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top products:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get trending products (상승 트렌드)
  app.get("/api/sales/trending", async (req, res) => {
    try {
      const trending = await storage.getTrendingProducts();
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending products:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Seed sample sales data
  app.post("/api/sales/seed", async (req, res) => {
    try {
      const sampleData = [
        {
          productName: "초코파이정",
          category: "초코",
          brand: "오리온",
          monthlySales: "15.2만개",
          trendScore: "상승",
          storeChain: "CU",
          rank: "1위",
        },
        {
          productName: "새우깡",
          category: "스낵",
          brand: "농심",
          monthlySales: "12.8만개",
          trendScore: "유지",
          storeChain: "GS25",
          rank: "2위",
        },
        {
          productName: "마이구미",
          category: "젤리",
          brand: "롯데",
          monthlySales: "10.5만개",
          trendScore: "상승",
          storeChain: "세븐일레븐",
          rank: "3위",
        },
        {
          productName: "빼빼로",
          category: "초코",
          brand: "롯데",
          monthlySales: "9.8만개",
          trendScore: "하락",
          storeChain: "CU",
          rank: "4위",
        },
        {
          productName: "포카칩",
          category: "스낵",
          brand: "오리온",
          monthlySales: "9.2만개",
          trendScore: "유지",
          storeChain: "이마트24",
          rank: "5위",
        },
        {
          productName: "꼬북칩",
          category: "스낵",
          brand: "오리온",
          monthlySales: "8.7만개",
          trendScore: "상승",
          storeChain: "GS25",
          rank: "6위",
        },
        {
          productName: "콘칩",
          category: "스낵",
          brand: "크라운",
          monthlySales: "7.5만개",
          trendScore: "유지",
          storeChain: "CU",
          rank: "7위",
        },
        {
          productName: "허니버터칩",
          category: "스낵",
          brand: "해태",
          monthlySales: "6.9만개",
          trendScore: "하락",
          storeChain: "세븐일레븐",
          rank: "8위",
        },
        {
          productName: "바나나킥",
          category: "과자",
          brand: "농심",
          monthlySales: "6.3만개",
          trendScore: "상승",
          storeChain: "GS25",
          rank: "9위",
        },
        {
          productName: "칸쵸",
          category: "초코",
          brand: "롯데",
          monthlySales: "5.8만개",
          trendScore: "유지",
          storeChain: "이마트24",
          rank: "10위",
        },
        {
          productName: "오예스",
          category: "과자",
          brand: "해태",
          monthlySales: "5.5만개",
          trendScore: "상승",
          storeChain: "CU",
          rank: "11위",
        },
        {
          productName: "스윙칩",
          category: "스낵",
          brand: "농심",
          monthlySales: "5.2만개",
          trendScore: "유지",
          storeChain: "GS25",
          rank: "12위",
        },
        {
          productName: "홈런볼",
          category: "초코",
          brand: "해태",
          monthlySales: "4.8만개",
          trendScore: "하락",
          storeChain: "세븐일레븐",
          rank: "13위",
        },
        {
          productName: "ABC초콜릿",
          category: "초코",
          brand: "롯데",
          monthlySales: "4.5만개",
          trendScore: "상승",
          storeChain: "CU",
          rank: "14위",
        },
        {
          productName: "고래밥",
          category: "스낵",
          brand: "농심",
          monthlySales: "4.2만개",
          trendScore: "유지",
          storeChain: "이마트24",
          rank: "15위",
        },
      ];

      const seeded = await storage.bulkCreateProductSales(sampleData);
      res.json({ message: "Sample data seeded successfully", count: seeded.length });
    } catch (error) {
      console.error("Error seeding sales data:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Generate marketing strategies with images
  app.post("/api/strategies/generate/:projectId", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      console.log(`[Strategies] Starting generation for project: ${projectId}`);
      
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

      // Fetch real-time sales data for context
      const topProducts = await storage.getTopProducts(10);
      const trendingProducts = await storage.getTrendingProducts();

      // Generate strategies with sales data context
      console.log("[Strategies] Generating AI strategies...");
      const strategies = await generateMarketingStrategies(
        {
          productName: project.productName,
          targetAge: project.targetAge,
          marketingSeason: project.marketingSeason,
          currentStatus: project.currentStatus,
        },
        conversationText,
        {
          topProducts: topProducts.map(p => ({
            productName: p.productName,
            rank: p.rank || "",
            monthlySales: p.monthlySales,
            category: p.category,
          })),
          trendingProducts: trendingProducts.map(p => ({
            productName: p.productName,
            trendScore: p.trendScore,
            category: p.category,
            monthlySales: p.monthlySales,
          })),
        }
      );
      console.log(`[Strategies] Generated ${strategies.length} strategies`);

      // Generate images for all strategies in parallel
      console.log(`[Strategies] Generating ${strategies.length} marketing images...`);
      const imageRequests = strategies.map(s => ({
        productName: project.productName,
        strategyTitle: s.title,
        strategyDescription: s.description,
      }));

      const imageBuffers = await generateMarketingImages(imageRequests);
      console.log(`[Strategies] All images generated successfully`);

      // Save strategies with image data URLs
      console.log("[Strategies] Saving strategies to storage...");
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

      console.log(`[Strategies] Successfully saved ${savedStrategies.length} strategies with images`);
      res.json({ strategies: savedStrategies });
    } catch (error) {
      console.error("[Strategies] Error generating strategies:", error);
      console.error("[Strategies] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Server error" 
      });
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
