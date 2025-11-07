import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Project, ProductSales } from "@shared/schema";

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: salesData = [], isLoading: salesLoading } = useQuery<ProductSales[]>({
    queryKey: ["/api/sales"],
  });

  const { data: topProducts = [] } = useQuery<ProductSales[]>({
    queryKey: ["/api/sales/top"],
  });

  const trendingCount = salesData.filter(s => s.trendScore === "상승").length;
  const decliningCount = salesData.filter(s => s.trendScore === "하락").length;
  const stableCount = salesData.filter(s => s.trendScore === "유지").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
          <Link href="/survey">
            <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" data-testid="button-new-project">
              <Sparkles className="w-4 h-4" />
              새 프로젝트
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black font-accent text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400" data-testid="text-dashboard-title">
            대시보드
          </h1>
          <p className="text-lg text-muted-foreground">
            프로젝트 히스토리 및 판매 트렌드 분석
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
                상승 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{trendingCount}</div>
              <p className="text-sm text-muted-foreground mt-2">제품</p>
            </CardContent>
          </Card>

          <Card className="border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Minus className="w-5 h-5" />
                유지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stableCount}</div>
              <p className="text-sm text-muted-foreground mt-2">제품</p>
            </CardContent>
          </Card>

          <Card className="border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                하락 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{decliningCount}</div>
              <p className="text-sm text-muted-foreground mt-2">제품</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold font-accent">인기 과자 TOP 5</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <Card key={product.id} className="border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" data-testid={`card-top-product-${index}`}>
                <CardHeader className="pb-2">
                  <div className="text-3xl font-black text-center text-orange-600">{product.rank}</div>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="font-bold text-lg">{product.productName}</div>
                  <Badge variant="secondary">{product.category}</Badge>
                  <div className="text-sm text-muted-foreground">{product.monthlySales}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold font-accent">프로젝트 히스토리</h2>
          {projectsLoading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">아직 프로젝트가 없습니다.</p>
              <Link href="/survey">
                <Button data-testid="button-create-first-project">첫 프로젝트 만들기</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover-elevate cursor-pointer transition-transform"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader>
                    <CardTitle className="font-accent text-xl">{project.productName}</CardTitle>
                    <CardDescription>
                      {project.createdAt && formatDistanceToNow(new Date(project.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{project.targetAge}</Badge>
                      <Badge variant="secondary">{project.marketingSeason}</Badge>
                      <Badge
                        variant={
                          project.currentStatus === "성공"
                            ? "default"
                            : project.currentStatus === "실패"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {project.currentStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/chat/${project.id}`}>
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-chat-${project.id}`}>
                          대화 보기
                        </Button>
                      </Link>
                      <Link href={`/results/${project.id}`}>
                        <Button variant="default" size="sm" className="flex-1" data-testid={`button-view-results-${project.id}`}>
                          전략 보기
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
