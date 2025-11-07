import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Message, type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoImage from "@assets/image_1762502653328.png";

interface StrategyCard {
  category: string;
  icon: string;
  title: string;
  summary: string;
  viralPoint: string;
}

interface DetailedStrategy {
  type: string;
  title: string;
  description: string;
  details: string;
  hashtags: string;
}

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id || "";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<DetailedStrategy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch project details
  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", projectId],
    enabled: !!projectId,
  });

  // Parse strategy cards from messages (optimized)
  const strategyCards: StrategyCard[] = (() => {
    const cardsMessage = messages.find(m => {
      try {
        const metadata = m.metadata ? JSON.parse(m.metadata) : {};
        return metadata.stage === "strategy_cards";
      } catch {
        return false;
      }
    });

    if (!cardsMessage?.metadata) {
      return [];
    }

    try {
      const metadata = JSON.parse(cardsMessage.metadata);
      return metadata.cards || [];
    } catch {
      return [];
    }
  })();

  // Find diagnosis message
  const diagnosisMessage = messages.find(m => {
    try {
      const metadata = m.metadata ? JSON.parse(m.metadata) : {};
      return metadata.stage === "diagnosis";
    } catch {
      return false;
    }
  });

  // Generate detailed strategy when card is clicked
  const generateDetailMutation = useMutation({
    mutationFn: async ({ category, title }: { category: string; title: string }) => {
      return await apiRequest<{ strategy: DetailedStrategy }>(
        "POST",
        `/api/strategies/detail/${projectId}`,
        { category, title }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", projectId] });
      setSelectedStrategy(data.strategy);
      setIsDialogOpen(true);
    },
    onError: () => {
      toast({
        title: "오류",
        description: "상세 전략 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleCardClick = (card: StrategyCard) => {
    generateDetailMutation.mutate({
      category: card.category,
      title: card.title,
    });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!projectId) {
    return null;
  }

  const isLoading = isLoadingMessages || generateDetailMutation.isPending;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <div className="text-center">
            <img 
              src={logoImage} 
              alt="ViVa" 
              className="h-10 mx-auto mb-1"
              data-testid="logo-image"
            />
            {project && (
              <p className="text-sm text-muted-foreground">{project.productName}</p>
            )}
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="container mx-auto max-w-4xl px-4 py-8">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : strategyCards.length > 0 ? (
              <div className="space-y-6">
                {diagnosisMessage && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {diagnosisMessage.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold font-sans mb-2">
                    {project?.productName}의 리브랜딩 전략
                  </h2>
                  <p className="text-muted-foreground">
                    카테고리별 핵심 전략을 확인하고 선택하세요
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {strategyCards.map((card, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md cursor-pointer transition-all border shadow-sm rounded-2xl"
                      onClick={() => !isLoading && handleCardClick(card)}
                      data-testid={`card-strategy-${card.category}`}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{card.icon}</span>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{card.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {card.category}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-foreground leading-relaxed">
                          {card.summary}
                        </p>
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">바이럴 포인트:</span> {card.viralPoint}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground font-medium">
                      상세 전략을 생성하고 있습니다...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <p className="text-muted-foreground">전략을 생성하고 있습니다...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detailed Strategy Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedStrategy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-sans">
                  {selectedStrategy.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground pt-2">
                  {selectedStrategy.description}
                </p>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedStrategy.details}
                  </ReactMarkdown>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">추천 해시태그:</span> {selectedStrategy.hashtags}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
