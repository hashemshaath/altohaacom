import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Gavel, Clock, TrendingUp, DollarSign, Flame, Timer, Tag, Percent, ShoppingBag } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  exhibitionId: string;
  isAr: boolean;
}

export function ExhibitionAuctionsOffers({ exhibitionId, isAr }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: auctions = [] } = useQuery({
    queryKey: ["exhibition-auctions", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_auctions")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .order("ends_at", { ascending: true });
      return data || [];
    },
  });

  const { data: offers = [] } = useQuery({
    queryKey: ["exhibition-offers", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_offers")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("is_active", true)
        .order("ends_at", { ascending: true });
      return data || [];
    },
  });

  // Realtime bids
  useEffect(() => {
    const channel = supabase
      .channel("auction-bids")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "exhibition_auction_bids" }, () => {
        queryClient.invalidateQueries({ queryKey: ["exhibition-auctions", exhibitionId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [exhibitionId, queryClient]);

  const placeBid = useMutation({
    mutationFn: async ({ auctionId, amount }: { auctionId: string; amount: number }) => {
      if (!user?.id) throw new Error("Login required");
      const { error } = await supabase.from("exhibition_auction_bids").insert({
        auction_id: auctionId,
        user_id: user.id,
        amount,
      });
      if (error) throw error;
      // Update current price
      await supabase.from("exhibition_auctions").update({ current_price: amount }).eq("id", auctionId);
    },
    onSuccess: (_, { auctionId }) => {
      setBidAmounts(prev => ({ ...prev, [auctionId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["exhibition-auctions"] });
      toast({ title: isAr ? "تم تقديم المزايدة!" : "Bid placed!" });
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", variant: "destructive" }),
  });

  const formatTimeLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - now;
    if (diff <= 0) return isAr ? "انتهى" : "Ended";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (hrs > 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const isLive = (auction: any) => {
    const start = new Date(auction.starts_at).getTime();
    const end = new Date(auction.ends_at).getTime();
    return now >= start && now <= end;
  };

  const liveAuctions = auctions.filter(isLive);
  const upcomingAuctions = auctions.filter(a => new Date(a.starts_at).getTime() > now);
  const activeOffers = offers.filter(o => new Date(o.ends_at).getTime() > now);

  return (
    <div className="space-y-6">
      {/* Live Auctions */}
      {liveAuctions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gavel className="h-5 w-5 text-destructive" />
            {isAr ? "مزادات حية" : "Live Auctions"}
            <Badge variant="destructive" className="animate-pulse">{isAr ? "مباشر" : "LIVE"}</Badge>
          </h3>
          {liveAuctions.map(auction => (
            <Card key={auction.id} className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {auction.image_url && (
                    <img src={auction.image_url} alt={auction.title} className="w-full sm:w-32 h-32 object-cover rounded-xl" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold">{isAr ? auction.title_ar || auction.title : auction.title}</h4>
                        <p className="text-xs text-muted-foreground">{isAr ? auction.description_ar || auction.description : auction.description}</p>
                      </div>
                      <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                        <Timer className="h-3 w-3" />{formatTimeLeft(auction.ends_at)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "السعر الحالي" : "Current Bid"}</p>
                        <p className="text-xl font-bold text-primary">
                          <AnimatedCounter value={Number(auction.current_price)} /> {auction.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isAr ? "الحد الأدنى" : "Min Increment"}</p>
                        <p className="text-sm font-medium">+{Number(auction.min_increment)} {auction.currency}</p>
                      </div>
                    </div>
                    {user && (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder={`${Number(auction.current_price) + Number(auction.min_increment)}+`}
                          value={bidAmounts[auction.id] || ""}
                          onChange={e => setBidAmounts(prev => ({ ...prev, [auction.id]: e.target.value }))}
                          className="w-36"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={
                            !bidAmounts[auction.id] ||
                            Number(bidAmounts[auction.id]) < Number(auction.current_price) + Number(auction.min_increment) ||
                            placeBid.isPending
                          }
                          onClick={() => placeBid.mutate({ auctionId: auction.id, amount: Number(bidAmounts[auction.id]) })}
                        >
                          <Gavel className="h-4 w-4 me-1" />{isAr ? "مزايدة" : "Bid"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming Auctions */}
      {upcomingAuctions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {isAr ? "مزادات قادمة" : "Upcoming Auctions"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {upcomingAuctions.map(auction => (
              <Card key={auction.id}>
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm">{isAr ? auction.title_ar || auction.title : auction.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {isAr ? "يبدأ من" : "Starts at"} {Number(auction.starting_price).toLocaleString()} {auction.currency}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "يبدأ خلال" : "Starts in"} {formatTimeLeft(auction.starts_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Flash Deals */}
      {activeOffers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            {isAr ? "عروض خاصة" : "Flash Deals"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {activeOffers.map(offer => {
              const remaining = offer.quantity_available ? offer.quantity_available - (offer.quantity_claimed || 0) : null;
              return (
                <Card key={offer.id} className="border-orange-200/50 overflow-hidden">
                  <CardContent className="p-0">
                    {offer.image_url && (
                      <img src={offer.image_url} alt={offer.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{isAr ? offer.title_ar || offer.title : offer.title}</h4>
                        <Badge variant="outline" className="text-xs gap-1 text-orange-600 border-orange-300">
                          <Timer className="h-3 w-3" />{formatTimeLeft(offer.ends_at)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{isAr ? offer.description_ar || offer.description : offer.description}</p>
                      <div className="flex items-center gap-2">
                        {offer.original_price && (
                          <span className="text-sm text-muted-foreground line-through">{Number(offer.original_price).toLocaleString()}</span>
                        )}
                        <span className="text-lg font-bold text-primary">{Number(offer.offer_price).toLocaleString()} {offer.currency}</span>
                        {offer.discount_percent && (
                          <Badge className="bg-destructive text-destructive-foreground text-xs">-{offer.discount_percent}%</Badge>
                        )}
                      </div>
                      {remaining !== null && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${Math.max(5, (remaining / (offer.quantity_available || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {remaining} {isAr ? "متبقي" : "left"}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {liveAuctions.length === 0 && upcomingAuctions.length === 0 && activeOffers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{isAr ? "لا توجد مزادات أو عروض حالياً" : "No auctions or offers at the moment"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
