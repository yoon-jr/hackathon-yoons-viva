import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Loader2, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Message, type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id || "";
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest<{ messages: Message[] }>("POST", `/api/chat/${projectId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", projectId] });
      setInput("");
    },
    onError: () => {
      toast({
        title: "오류",
        description: "메시지 전송에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // Generate strategies mutation
  const generateStrategiesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/strategies/generate/${projectId}`, {});
    },
    onSuccess: () => {
      setLocation(`/results/${projectId}`);
    },
    onError: () => {
      toast({
        title: "오류",
        description: "전략 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (input.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(input.trim());
    }
  };

  const handleGenerateStrategies = () => {
    generateStrategiesMutation.mutate();
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!projectId) {
    return null;
  }

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
            <h1 className="text-xl font-accent font-bold text-primary">역바이럴</h1>
            {project && (
              <p className="text-sm text-muted-foreground">{project.productName}</p>
            )}
          </div>
          <Button
            onClick={handleGenerateStrategies}
            disabled={generateStrategiesMutation.isPending || messages.length < 2}
            data-testid="button-generate-strategies"
          >
            {generateStrategiesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                전략 생성
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full max-w-4xl px-4 py-6">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-accent font-bold mb-2">AI 마케팅 에이전트와 대화를 시작하세요</h3>
                  <p className="text-muted-foreground">
                    {project?.productName}에 대한 마케팅 아이디어를 함께 발전시켜봅시다!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "어떤 콜라보가 좋을까요?",
                    "타겟 연령층에 맞는 전략은?",
                    "시즌 마케팅 아이디어 주세요",
                    "네이밍 전략이 궁금해요",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(suggestion)}
                      className="font-accent"
                      data-testid={`button-suggestion-${suggestion.slice(0, 10)}`}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.role}-${message.id}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <Card
                      className={`max-w-[80%] p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </Card>
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start" data-testid="message-loading">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <Card className="max-w-[80%] p-4 bg-card">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </Card>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              className="resize-none border-2 min-h-[80px]"
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending}
              size="icon"
              className="h-[80px] w-[80px] flex-shrink-0"
              data-testid="button-send"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
