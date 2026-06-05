import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign, InsertCampaign, DailyActual, InsertDailyActual } from "@shared/schema";

// Get all campaigns and pick the first one as active
export function useCampaignStore() {
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const campaign = campaigns[0] ?? null;

  return { campaigns, campaign, isLoading };
}

export function useDailyActuals(campaignId: number | undefined) {
  return useQuery<DailyActual[]>({
    queryKey: ["/api/campaigns", campaignId, "actuals"],
    queryFn: async () => {
      if (!campaignId) return [];
      const res = await apiRequest("GET", `/api/campaigns/${campaignId}/actuals`);
      return res.json();
    },
    enabled: !!campaignId,
  });
}

export function useUpsertActual(campaignId: number) {
  return useMutation({
    mutationFn: async (data: Omit<InsertDailyActual, "campaignId">) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/actuals`, { ...data, campaignId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "actuals"] });
    },
  });
}

export function useBulkUpsertActuals(campaignId: number) {
  return useMutation({
    mutationFn: async (rows: Omit<InsertDailyActual, "campaignId">[]) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/actuals/bulk`, rows);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "actuals"] });
    },
  });
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: async (data: InsertCampaign) => {
      const res = await apiRequest("POST", "/api/campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });
}

export function useUpdateCampaign(id: number) {
  return useMutation({
    mutationFn: async (data: Partial<InsertCampaign>) => {
      const res = await apiRequest("PATCH", `/api/campaigns/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });
}

export function useClearActuals(campaignId: number) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/campaigns/${campaignId}/actuals`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId, "actuals"] });
    },
  });
}