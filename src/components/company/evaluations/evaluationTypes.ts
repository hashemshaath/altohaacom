export interface CompanyEvaluation {
  id: string;
  company_id: string;
  overall_rating: number | null;
  quality_rating: number | null;
  delivery_rating: number | null;
  communication_rating: number | null;
  value_rating: number | null;
  review: string | null;
  review_ar: string | null;
  is_public: boolean | null;
  evaluated_by: string | null;
  order_id: string | null;
  competition_id: string | null;
  company_response: string | null;
  company_response_ar: string | null;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string | null;
}
