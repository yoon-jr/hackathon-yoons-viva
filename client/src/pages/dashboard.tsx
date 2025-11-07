import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Building2,
  BarChart3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Project, ProductSales } from "@shared/schema";
import logoImage from "@assets/logoImg.png";

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<
    Project[]
  >({
    queryKey: ["/api/projects"],
  });

  const { data: salesData = [], isLoading: salesLoading } = useQuery<
    ProductSales[]
  >({
    queryKey: ["/api/sales"],
  });

  const { data: topProducts = [] } = useQuery<ProductSales[]>({
    queryKey: ["/api/sales/top"],
  });

  interface ProductTrend {
    productId: string;
    productName: string;
    brandName: string;
    cagr: number;
  }

  interface BrandAnalytics {
    brandId: string;
    brandName: string;
    totalSales2024: number;
    marketShare: number;
    productCount: number;
  }

  interface CompanyInsights {
    totalMarketSize2024: number;
    totalMarketSize2020: number;
    marketCAGR: number;
    topGrowingProducts: ProductTrend[];
    topDecliningProducts: ProductTrend[];
    topBrands: BrandAnalytics[];
    summary: string;
  }

  const { data: companyInsights, isLoading: insightsLoading, error: insightsError } = useQuery<CompanyInsights>({
    queryKey: ["/api/company/insights"],
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const trendingCount = salesData.filter((s) => s.trendScore === "상승").length;
  const decliningCount = salesData.filter(
    (s) => s.trendScore === "하락",
  ).length;
  const stableCount = salesData.filter((s) => s.trendScore === "유지").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="gap-2"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
          <img
            src={logoImage}
            alt="ViVa"
            className="h-10"
            data-testid="logo-image"
          />
          <Link href="/survey">
            <Button className="gap-2" data-testid="button-new-project">
              <Sparkles className="w-4 h-4" />새 프로젝트
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-4">
          <h1
            className="text-4xl font-bold font-sans"
            data-testid="text-dashboard-title"
          >
            대시보드
          </h1>
          <p className="text-lg text-muted-foreground">
            프로젝트 히스토리 및 판매 트렌드 분석
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border shadow-sm rounded-2xl">
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

          <Card className="border shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Minus className="w-5 h-5" />
                유지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stableCount}</div>
              <p className="text-sm text-muted-foreground mt-2">제품</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
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

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold font-sans">기업 시장 인사이트</h2>
          </div>

          {insightsLoading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">시장 분석 중...</div>
            </div>
          ) : insightsError ? (
            <Card className="border shadow-md rounded-2xl">
              <CardContent className="py-12 text-center">
                <p className="text-destructive">데이터를 불러올 수 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  잠시 후 다시 시도해주세요.
                </p>
              </CardContent>
            </Card>
          ) : companyInsights ? (
            <>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border shadow-md rounded-2xl bg-gradient-to-br from-orange-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <BarChart3 className="w-5 h-5" />
                    전체 시장 규모
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-orange-600">
                    {(companyInsights.totalMarketSize2024 / 10000).toFixed(1)}
                    <span className="text-xl ml-1">억원</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">2024년 기준</p>
                </CardContent>
              </Card>

              <Card className="border shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    연평균 성장률
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${companyInsights.marketCAGR > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {companyInsights.marketCAGR > 0 ? '+' : ''}
                    {companyInsights.marketCAGR.toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">2020-2024 CAGR</p>
                </CardContent>
              </Card>

              <Card className="border shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI 분석 제품
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {companyInsights.topGrowingProducts?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">급성장 제품</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  AI 시장 분석 요약
                </CardTitle>
                <CardDescription>
                  전체 시장 트렌드와 주요 인사이트
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{companyInsights.summary}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
            </>
          ) : null}
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold font-sans">인기 과자 TOP 5</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <Card
                key={product.id}
                className="border shadow-sm rounded-2xl"
                data-testid={`card-top-product-${index}`}
              >
                <CardHeader className="pb-2">
                  <div className="text-3xl font-black text-center text-orange-600">
                    {product.rank}
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="font-bold text-lg">{product.productName}</div>
                  <Badge variant="secondary">{product.category}</Badge>
                  <div className="text-sm text-muted-foreground">
                    {product.monthlySales}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold font-sans">프로젝트 히스토리</h2>
          {projectsLoading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                아직 프로젝트가 없습니다.
              </p>
              <Link href="/survey">
                <Button data-testid="button-create-first-project">
                  첫 프로젝트 만들기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="border shadow-sm hover:shadow-md cursor-pointer transition-all rounded-2xl"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader>
                    <CardTitle className="font-sans text-xl">
                      {project.productName}
                    </CardTitle>
                    <CardDescription>
                      {project.createdAt &&
                        formatDistanceToNow(new Date(project.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{project.targetAge}</Badge>
                      <Badge variant="secondary">
                        {project.marketingSeason}
                      </Badge>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          data-testid={`button-view-chat-${project.id}`}
                        >
                          대화 보기
                        </Button>
                      </Link>
                      <Link href={`/results/${project.id}`}>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          data-testid={`button-view-results-${project.id}`}
                        >
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
