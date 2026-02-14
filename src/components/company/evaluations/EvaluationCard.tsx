import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Reply, Calendar, CheckCircle } from "lucide-react";
import { CompanyEvaluation } from "./evaluationTypes";
import { format } from "date-fns";

interface Props {
  evaluation: CompanyEvaluation;
  language: string;
  onRespond: (id: string, response: string, responseAr: string) => void;
  isResponding: boolean;
}

const renderStars = (rating: number) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= Math.round(rating) ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

export function EvaluationCard({ evaluation, language, onRespond, isResponding }: Props) {
  const isAr = language === "ar";
  const [showReply, setShowReply] = useState(false);
  const [response, setResponse] = useState("");
  const [responseAr, setResponseAr] = useState("");
  const hasResponse = !!evaluation.company_response;

  const handleSubmit = () => {
    if (!response.trim() && !responseAr.trim()) return;
    onRespond(evaluation.id, response, responseAr);
    setShowReply(false);
    setResponse("");
    setResponseAr("");
  };

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {renderStars(evaluation.overall_rating || 0)}
            <span className="text-sm font-medium">{evaluation.overall_rating}/5</span>
          </div>
          <div className="flex items-center gap-2">
            {evaluation.created_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(evaluation.created_at), "MMM dd, yyyy")}
              </span>
            )}
            {evaluation.is_public && (
              <Badge variant="outline" className="text-xs">
                {isAr ? "عام" : "Public"}
              </Badge>
            )}
          </div>
        </div>

        {/* Rating badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {evaluation.quality_rating && (
            <Badge variant="secondary" className="text-xs">
              {isAr ? "جودة" : "Quality"}: {evaluation.quality_rating}/5
            </Badge>
          )}
          {evaluation.delivery_rating && (
            <Badge variant="secondary" className="text-xs">
              {isAr ? "تسليم" : "Delivery"}: {evaluation.delivery_rating}/5
            </Badge>
          )}
          {evaluation.communication_rating && (
            <Badge variant="secondary" className="text-xs">
              {isAr ? "تواصل" : "Comm"}: {evaluation.communication_rating}/5
            </Badge>
          )}
          {evaluation.value_rating && (
            <Badge variant="secondary" className="text-xs">
              {isAr ? "قيمة" : "Value"}: {evaluation.value_rating}/5
            </Badge>
          )}
        </div>

        {/* Review text */}
        {(evaluation.review || evaluation.review_ar) && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {isAr ? evaluation.review_ar || evaluation.review : evaluation.review}
          </p>
        )}

        {/* Company response */}
        {hasResponse && (
          <div className="mt-3 rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{isAr ? "رد الشركة" : "Company Response"}</span>
              {evaluation.responded_at && (
                <span className="text-xs text-muted-foreground">
                  · {format(new Date(evaluation.responded_at), "MMM dd, yyyy")}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed">
              {isAr ? evaluation.company_response_ar || evaluation.company_response : evaluation.company_response}
            </p>
          </div>
        )}

        {/* Reply button / form */}
        {!hasResponse && !showReply && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowReply(true)}>
            <Reply className="me-2 h-4 w-4" />
            {isAr ? "الرد" : "Reply"}
          </Button>
        )}

        {showReply && (
          <div className="mt-3 space-y-3 rounded-lg border p-3">
            <Textarea
              placeholder={isAr ? "اكتب ردك..." : "Write your response..."}
              value={isAr ? responseAr : response}
              onChange={(e) => isAr ? setResponseAr(e.target.value) : setResponse(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReply(false)}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isResponding || (!response.trim() && !responseAr.trim())}>
                <MessageSquare className="me-2 h-4 w-4" />
                {isAr ? "إرسال الرد" : "Send Reply"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
