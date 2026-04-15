import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Code2, Globe } from "lucide-react";

interface SchemaItem {
  type: string;
  pages: string[];
  status: "implemented" | "partial" | "missing";
  fields: string[];
}

const SCHEMAS: SchemaItem[] = [
  { type: "Organization", pages: ["/", "/about"], status: "implemented", fields: ["name", "url", "logo", "sameAs", "description", "contactPoint"] },
  { type: "WebSite", pages: ["/"], status: "implemented", fields: ["name", "url", "potentialAction (SearchAction)", "inLanguage"] },
  { type: "WebPage", pages: ["All pages"], status: "implemented", fields: ["name", "description", "url", "breadcrumb", "relatedLink"] },
  { type: "Article", pages: ["/news/:slug"], status: "implemented", fields: ["headline", "description", "image", "datePublished", "dateModified", "wordCount", "author"] },
  { type: "BreadcrumbList", pages: ["All pages"], status: "implemented", fields: ["itemListElement", "position", "name", "item"] },
  { type: "Person", pages: ["/profile/:slug", "/chefs/:id"], status: "implemented", fields: ["name", "jobTitle", "image", "sameAs", "worksFor"] },
  { type: "FAQPage", pages: ["/help", "/faq"], status: "implemented", fields: ["mainEntity", "acceptedAnswer"] },
  { type: "MobileApplication", pages: ["/"], status: "implemented", fields: ["name", "operatingSystem", "applicationCategory"] },
  { type: "Event", pages: ["/exhibitions/:slug", "/events-calendar"], status: "partial", fields: ["name", "startDate", "endDate", "location", "image", "offers"] },
  { type: "Recipe", pages: ["/recipes/:slug"], status: "implemented", fields: ["name", "image", "author", "datePublished", "description", "prepTime", "cookTime", "recipeIngredient", "recipeInstructions", "nutrition"] },
  { type: "Product", pages: ["/shop/:slug"], status: "partial", fields: ["name", "image", "description", "offers", "brand", "sku", "review", "aggregateRating"] },
  { type: "Course", pages: ["/masterclasses/:slug"], status: "partial", fields: ["name", "description", "provider", "hasCourseInstance"] },
  { type: "ItemList", pages: ["/rankings", "/competitions"], status: "partial", fields: ["itemListElement", "numberOfItems"] },
  { type: "LocalBusiness", pages: ["/establishments/:slug"], status: "partial", fields: ["name", "address", "telephone", "openingHours", "geo", "priceRange"] },
  { type: "JobPosting", pages: ["/jobs/:slug"], status: "missing", fields: ["title", "description", "datePosted", "validThrough", "hiringOrganization", "jobLocation", "employmentType"] },
  { type: "Review", pages: ["/establishments/:slug"], status: "missing", fields: ["author", "reviewRating", "itemReviewed", "reviewBody"] },
];

export const SEOStructuredData = memo(function SEOStructuredData({ isAr }: { isAr: boolean }) {
  const implemented = SCHEMAS.filter(s => s.status === "implemented").length;
  const partial = SCHEMAS.filter(s => s.status === "partial").length;
  const missing = SCHEMAS.filter(s => s.status === "missing").length;
  const coverage = Math.round((implemented / SCHEMAS.length) * 100);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{implemented}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "مطبق بالكامل" : "Implemented"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{partial}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "جزئي" : "Partial"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{missing}</p>
            <p className="text-xs text-muted-foreground">{isAr ? "مفقود" : "Missing"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{coverage}%</p>
            <p className="text-xs text-muted-foreground">{isAr ? "التغطية" : "Coverage"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Schema list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            {isAr ? "مخطط البيانات المنظمة (JSON-LD)" : "Structured Data Schemas (JSON-LD)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SCHEMAS.map((schema) => (
              <div key={schema.type} className="flex items-start gap-3 rounded-xl border border-border/30 p-3 hover:bg-muted/20 transition-colors">
                {schema.status === "implemented" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : schema.status === "partial" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-semibold text-primary">{schema.type}</code>
                    <Badge
                      variant={schema.status === "implemented" ? "default" : schema.status === "partial" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {schema.status === "implemented" ? "✓" : schema.status === "partial" ? "⚠" : "✗"} {schema.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Globe className="h-2.5 w-2.5" />
                    {schema.pages.join(", ")}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {schema.fields.map((f) => (
                      <span key={f} className="text-xs bg-muted/60 px-1.5 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation link */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{isAr ? "تحقق من الصلاحية:" : "Validate at:"}</span>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Rich Results Test ↗
            </a>
            <span>·</span>
            <a
              href="https://validator.schema.org/"
              target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Schema.org Validator ↗
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
