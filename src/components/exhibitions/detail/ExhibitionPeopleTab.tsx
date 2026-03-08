import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, CheckCircle2, Mic2, Users } from "lucide-react";
import { countryFlag as getCountryFlagUtil } from "@/lib/countryFlag";

function getCountryFlag(country?: string): string {
  if (!country) return "🏳️";
  return getCountryFlagUtil(country) || "🏳️";
}

interface Speaker {
  name?: string;
  name_ar?: string;
  title?: string;
  title_ar?: string;
  role?: string;
  role_ar?: string;
  topic?: string;
  topic_ar?: string;
  image_url?: string;
  country?: string;
}

interface Props {
  judgeProfiles: any[] | null;
  speakers: Speaker[];
  isAr: boolean;
}

export const ExhibitionPeopleTab = memo(function ExhibitionPeopleTab({ judgeProfiles, speakers, isAr }: Props) {
  const hasJudges = judgeProfiles && judgeProfiles.length > 0;
  const hasSpeakers = speakers.length > 0;

  return (
    <div className="space-y-8">
      {hasJudges && (
        <section>
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
              <Award className="h-4 w-4 text-chart-4" />
            </div>
            {isAr ? "لجنة التحكيم" : "Judging Committee"}
            <Badge variant="secondary" className="ms-1">
              {judgeProfiles!.length}
            </Badge>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {judgeProfiles!.map((judge: any) => {
              const judgeName = judge.full_name;
              const jp = judge.judgeExtra;
              const photo = jp?.profile_photo_url || judge.avatar_url;
              const judgeTitle = isAr && jp?.judge_title_ar ? jp.judge_title_ar : jp?.judge_title;
              const initials = (judgeName || "J")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const nationalityFlag = getCountryFlag(jp?.nationality || judge.location);

              return (
                <Link
                  key={judge.user_id}
                  to={`/${judge.username || judge.user_id}`}
                  className="group block rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <div className="flex gap-4 p-5">
                    <Avatar className="h-16 w-16 rounded-xl shrink-0 ring-2 ring-background shadow-md">
                      <AvatarImage src={photo || undefined} alt={judgeName} className="object-cover" />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                          {judgeName || (isAr ? "حكم" : "Judge")}
                        </span>
                        {judge.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="text-base leading-none ms-0.5">{nationalityFlag}</span>
                      </div>
                      {judgeTitle && (
                        <p className="text-xs text-primary/80 font-medium truncate">{judgeTitle}</p>
                      )}
                      {(jp?.current_position || jp?.current_employer) && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {jp.current_position}
                          {jp.current_position && jp.current_employer ? " · " : ""}
                          {jp.current_employer}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-t bg-muted/20 px-5 py-2.5 flex items-center gap-2 flex-wrap">
                    {jp?.judge_level && (
                      <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                        <Award className="h-2.5 w-2.5" />
                        {jp.judge_level}
                      </Badge>
                    )}
                    {jp?.judge_category && (
                      <Badge variant="secondary" className="text-[9px] h-5">
                        {jp.judge_category}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {hasSpeakers && (
        <section>
          <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Mic2 className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "المتحدثون" : "Speakers"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {speakers.map((speaker, i) => (
              <Card key={i} className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="flex flex-col items-center p-5 text-center">
                  {speaker.image_url ? (
                    <img
                      src={speaker.image_url}
                      alt={speaker.name}
                      className="mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-border"
                    />
                  ) : (
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <h4 className="text-sm font-semibold">
                    {isAr && speaker.name_ar ? speaker.name_ar : speaker.name}
                    {speaker.country && ` ${getCountryFlag(speaker.country)}`}
                  </h4>
                  {(speaker.title || speaker.title_ar) && (
                    <p className="mt-0.5 text-xs text-primary/80 font-medium">
                      {isAr && speaker.title_ar ? speaker.title_ar : speaker.title}
                    </p>
                  )}
                  {(speaker.topic || speaker.topic_ar) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isAr && speaker.topic_ar ? speaker.topic_ar : speaker.topic}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});
