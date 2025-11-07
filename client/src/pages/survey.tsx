import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertProjectSchema, type InsertProject, type Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Survey() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      productName: "",
      targetAge: "20대",
      marketingSeason: "기타",
      currentStatus: "비바이럴",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      return await apiRequest<Project>("POST", "/api/projects", data);
    },
    onSuccess: (data) => {
      console.log("Project created:", data);
      setLocation(`/chat/${data.id}`);
    },
    onError: () => {
      toast({
        title: "오류",
        description: "프로젝트 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <h1 className="text-2xl font-accent font-bold text-primary">역바이럴</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Survey Form */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-accent font-bold mb-4" data-testid="text-survey-title">
            새 프로젝트 시작하기
          </h2>
          <p className="text-lg text-muted-foreground">
            제품 정보를 입력하면 AI가 맞춤형 마케팅 전략을 생성합니다
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-12" data-testid="progress-indicator">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-accent font-bold transition-all ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <div className={`h-1 w-16 transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-accent font-bold transition-all ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <div className={`h-1 w-16 transition-all ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-accent font-bold transition-all ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
        </div>

        <Card className="p-8 border-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Step 1: Product Name */}
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">어떤 과자를 리브랜딩하고 싶으신가요?</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="예: 바밤바, 쫀드기, 꼬깔콘..."
                            className="border-2 text-lg py-6"
                            data-testid="input-product-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (form.getValues("productName")) {
                        setStep(2);
                      } else {
                        form.setError("productName", { message: "과자 이름을 입력해주세요" });
                      }
                    }}
                    className="w-full py-6 text-lg font-accent"
                    data-testid="button-next-step-1"
                  >
                    다음
                  </Button>
                </div>
              )}

              {/* Step 2: Target Age & Season */}
              {step === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="targetAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">타겟 연령층</FormLabel>
                        <div className="grid grid-cols-3 gap-4">
                          {(["10대", "20대", "30대"] as const).map((age) => (
                            <Button
                              key={age}
                              type="button"
                              variant={field.value === age ? "default" : "outline"}
                              className="py-6 font-accent text-lg border-2"
                              onClick={() => field.onChange(age)}
                              data-testid={`button-age-${age}`}
                            >
                              {age}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marketingSeason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">홍보 시기</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-2 text-lg py-6" data-testid="select-season">
                              <SelectValue placeholder="시기를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="수능시즌">수능시즌 (11월)</SelectItem>
                            <SelectItem value="여름">여름 (7~8월)</SelectItem>
                            <SelectItem value="연말">연말 (12~1월)</SelectItem>
                            <SelectItem value="명절">명절 (설/추석)</SelectItem>
                            <SelectItem value="기타">기타</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 py-6 text-lg font-accent border-2"
                      data-testid="button-back-step-2"
                    >
                      이전
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 py-6 text-lg font-accent"
                      data-testid="button-next-step-2"
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Current Status */}
              {step === 3 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="currentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">현재 상태</FormLabel>
                        <div className="grid grid-cols-3 gap-4">
                          {(["성공", "실패", "비바이럴"] as const).map((status) => (
                            <Button
                              key={status}
                              type="button"
                              variant={field.value === status ? "default" : "outline"}
                              className="py-6 font-accent text-lg border-2"
                              onClick={() => field.onChange(status)}
                              data-testid={`button-status-${status}`}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          성공: 이미 바이럴 중 | 실패: 시도했으나 실패 | 비바이럴: 홍보 부족
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 py-6 text-lg font-accent border-2"
                      data-testid="button-back-step-3"
                    >
                      이전
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProjectMutation.isPending}
                      className="flex-1 py-6 text-lg font-accent"
                      data-testid="button-submit"
                    >
                      {createProjectMutation.isPending ? (
                        "생성 중..."
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          AI 전략 생성 시작
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
