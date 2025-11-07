import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Image,
  BarChart3,
} from "lucide-react";
import logoImage from "@assets/logoImg.png";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src={logoImage}
            alt="ViVa"
            className="h-10"
            data-testid="logo-image"
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="font-sans gap-2"
              data-testid="button-dashboard"
            >
              <BarChart3 className="w-4 h-4" />
              대시보드
            </Button>
            <Button
              onClick={() => setLocation("/survey")}
              className="font-sans"
              data-testid="button-start-project"
            >
              새 프로젝트 시작
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <p
            className="text-xl md:text-3xl text-muted-foreground mb-8 font-sans"
            data-testid="text-hero-subtitle"
          >
            AI 기반 리브랜딩 마케팅 플랫폼
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            추억의 과자에 새로운 생명을! GPT와 DALL-E가 당신의 제품을 위한
            맞춤형 마케팅 전략과 비주얼을 생성합니다.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/survey")}
            className="text-lg px-8 py-6 font-sans shadow-lg hover:shadow-xl transition-all"
            data-testid="button-start-free"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            무료로 시작하기
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3
            className="text-3xl md:text-4xl font-sans font-bold text-center mb-16"
            data-testid="text-how-it-works"
          >
            이렇게 작동합니다
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card
              className="p-8 border shadow-sm hover:shadow-md transition-all rounded-2xl"
              data-testid="card-step-1"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-sans font-bold mb-4">
                ①
              </div>
              <h4 className="text-xl font-bold mb-3">제품 정보 입력</h4>
              <p className="text-muted-foreground">
                바이럴시키고 싶은 과자와 타겟 세대, 홍보 시기를 선택하세요.
              </p>
            </Card>

            <Card
              className="p-8 border shadow-sm hover:shadow-md transition-all rounded-2xl"
              data-testid="card-step-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-sans font-bold mb-4">
                ②
              </div>
              <h4 className="text-xl font-bold mb-3">AI와 대화하기</h4>
              <p className="text-muted-foreground">
                AI 에이전트와 대화하며 맞춤형 마케팅 전략을 함께 만들어갑니다.
              </p>
            </Card>

            <Card
              className="p-8 border shadow-sm hover:shadow-md transition-all rounded-2xl"
              data-testid="card-step-3"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-sans font-bold mb-4">
                ③
              </div>
              <h4 className="text-xl font-bold mb-3">전략과 비주얼 획득</h4>
              <p className="text-muted-foreground">
                여러 마케팅 전략 카드와 DALL-E가 생성한 패키징 이미지를
                받으세요.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl md:text-4xl font-sans font-bold text-center mb-16">
            주요 기능
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card
              className="p-8 border shadow-sm rounded-2xl"
              data-testid="card-feature-ai"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">세대별 맞춤 전략</h4>
              <p className="text-muted-foreground">
                알파세대(디지털 네이티브), Z세대(트렌디/밈),
                밀레니얼세대(감성/경험), X세대(신뢰/품질) 등 타겟에 맞는 전략을
                자동 생성합니다.
              </p>
            </Card>

            <Card
              className="p-8 border shadow-sm rounded-2xl"
              data-testid="card-feature-chat"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">대화형 AI 에이전트</h4>
              <p className="text-muted-foreground">
                GPT와 자연스러운 대화를 통해 아이디어를 발전시키고 피드백을
                반영할 수 있습니다.
              </p>
            </Card>

            <Card
              className="p-8 border shadow-sm rounded-2xl"
              data-testid="card-feature-visual"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">DALL-E 이미지 생성</h4>
              <p className="text-muted-foreground">
                각 전략에 맞는 패키징 디자인과 포스터를 AI가 자동으로
                생성합니다.
              </p>
            </Card>

            <Card
              className="p-8 border shadow-sm rounded-2xl"
              data-testid="card-feature-strategies"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">다양한 전략 카드</h4>
              <p className="text-muted-foreground">
                콜라보, 네이밍, 캠페인, 시즌마케팅 등 여러 전략을 카드 형태로
                제공합니다.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 mt-24">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 ViVa. AI 기반 리브랜딩 마케팅 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}
