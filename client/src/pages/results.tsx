import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Download, Share2, Star, Type, Megaphone, Calendar, Loader2 } from "lucide-react";
import { type Strategy, type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const strategyIcons = {
  "콜라보": Star,
  "네이밍": Type,
  "캠페인": Megaphone,
  "시즌마케팅": Calendar,
};

const strategyColors = {
  "콜라보": "text-primary",
  "네이밍": "text-secondary",
  "캠페인": "text-accent",
  "시즌마케팅": "text-chart-1",
};

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Fetch project
  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Fetch strategies
  const { data: strategies = [], isLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies", projectId],
    enabled: !!projectId,
  });

  const handleShare = (strategy: Strategy) => {
    const text = `${strategy.title}\n\n${strategy.description}\n\n${strategy.hashtags}`;
    
    if (navigator.share) {
      navigator.share({
        title: strategy.title,
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: "복사 완료",
        description: "전략이 클립보드에 복사되었습니다.",
      });
    }
  };

  const handleDownloadImage = (imageUrl: string | null) => {
    if (!imageUrl) return;
    
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "marketing-visual.png";
    link.click();
  };

  if (!projectId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation(`/chat/${projectId}`)} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-sans font-bold text-primary">ViVa</h1>
            {project && (
              <p className="text-sm text-muted-foreground">{project.productName}</p>
            )}
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Results */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-accent font-bold mb-4" data-testid="text-results-title">
            마케팅 전략 결과
          </h2>
          <p className="text-lg text-muted-foreground">
            AI가 생성한 {project?.productName} 전용 마케팅 전략과 비주얼입니다
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : strategies.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">
              아직 생성된 전략이 없습니다. 채팅에서 전략을 생성해주세요.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => {
              const Icon = strategyIcons[strategy.type as keyof typeof strategyIcons] || Star;
              const colorClass = strategyColors[strategy.type as keyof typeof strategyColors] || "text-primary";

              return (
                <Card
                  key={strategy.id}
                  className="border-3 hover-elevate hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedStrategy(strategy)}
                  data-testid={`card-strategy-${strategy.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className={`h-8 w-8 ${colorClass}`} />
                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                        {strategy.type}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{strategy.title}</CardTitle>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {strategy.imageUrl ? (
                      <img
                        src={strategy.imageUrl}
                        alt={strategy.title}
                        className="w-full aspect-video object-cover rounded-md border-2 mb-4"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-muted rounded-md border-2 border-dashed flex items-center justify-center mb-4">
                        <p className="text-muted-foreground text-sm">이미지 위치 (생성 비활성화)</p>
                      </div>
                    )}
                  </CardContent>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full font-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStrategy(strategy);
                      }}
                      data-testid={`button-view-details-${strategy.id}`}
                    >
                      자세히 보기
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategy Detail Modal */}
      <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedStrategy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-accent">{selectedStrategy.title}</DialogTitle>
              </DialogHeader>
              
              <div className="my-4">
                {selectedStrategy.imageUrl ? (
                  <img
                    src={selectedStrategy.imageUrl}
                    alt={selectedStrategy.title}
                    className="w-full rounded-lg border-3"
                    data-testid="img-strategy-detail"
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-lg border-3 border-dashed flex items-center justify-center">
                    <p className="text-muted-foreground">이미지 위치 (생성 비활성화)</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-lg mb-2">전략 설명</h4>
                  <p className="text-muted-foreground">{selectedStrategy.description}</p>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">실행 방법</h4>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{selectedStrategy.details}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-2">추천 해시태그</h4>
                  <p className="text-primary font-accent">{selectedStrategy.hashtags}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedStrategy.imageUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadImage(selectedStrategy.imageUrl)}
                      className="flex-1"
                      data-testid="button-download-image"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      이미지 다운로드
                    </Button>
                  )}
                  <Button
                    onClick={() => handleShare(selectedStrategy)}
                    className="flex-1"
                    data-testid="button-share"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    공유하기
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
