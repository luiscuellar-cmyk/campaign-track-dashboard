import { useState, useEffect } from "react";
import { useCampaignStore, useCreateCampaign, useUpdateCampaign } from "@/hooks/useCampaignStore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsertCampaign } from "@shared/schema";

function Field({ label, id, value, onChange, type = "text", step, min, max, hint }: {
  label: string; id: string; value: any; onChange: (v: any) => void;
  type?: string; step?: string; min?: string; max?: string; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        id={id}
        data-testid={`input-${id}`}
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const DEFAULT_FORM: InsertCampaign = {
  name: "Campaña Digital 2026",
  totalBudget: 10_000_000,
  startDate: "2026-06-09",
  durationDays: 17,
  pctInstagram: 0.30,
  pctFacebook: 0.25,
  pctGoogleSearch: 0.30,
  pctGoogleDisplay: 0.15,
  cpmInstagram: 7500,
  cpmFacebook: 6000,
  cpmGoogleSearch: 5000,
  cpmGoogleDisplay: 3500,
  ctrInstagram: 0.018,
  ctrFacebook: 0.015,
  ctrGoogleSearch: 0.045,
  ctrGoogleDisplay: 0.008,
};

export default function SettingsPage() {
  const { campaign, isLoading } = useCampaignStore();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign(campaign?.id ?? 0);
  const { toast } = useToast();
  const [form, setForm] = useState<InsertCampaign>(DEFAULT_FORM);

  useEffect(() => {
    if (campaign) setForm(campaign);
  }, [campaign?.id]);

  const set = (key: keyof InsertCampaign) => (val: any) => setForm(f => ({ ...f, [key]: val }));

  const pctTotal = form.pctInstagram + form.pctFacebook + form.pctGoogleSearch + form.pctGoogleDisplay;
  const pctValid = Math.abs(pctTotal - 1) < 0.001;

  const handleSave = async () => {
    if (!pctValid) {
      toast({ title: "Los porcentajes deben sumar 100%", variant: "destructive" });
      return;
    }
    try {
      if (campaign) {
        await updateCampaign.mutateAsync(form);
        toast({ title: "Campaña actualizada" });
      } else {
        await createCampaign.mutateAsync(form);
        toast({ title: "Campaña creada" });
      }
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Información de campaña</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre de campaña" id="name" value={form.name} onChange={set("name")} hint="Identificador visible en el dashboard" />
          <Field label="Presupuesto total (COP)" id="totalBudget" type="number" min="0" step="100000" value={form.totalBudget} onChange={set("totalBudget")} />
          <Field label="Fecha de inicio" id="startDate" type="date" value={form.startDate} onChange={set("startDate")} />
          <Field label="Duración (días)" id="durationDays" type="number" min="1" max="60" value={form.durationDays} onChange={set("durationDays")} />
          <Field label="Meta de Alcance Total" id="reachGoal" type="number" min="0" step="10000" value={form.reachGoal} onChange={set("reachGoal")} hint="Objetivo de personas alcanzadas" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Distribución de presupuesto</h2>
          <span className={`text-xs font-semibold tabular px-2 py-1 rounded-full ${pctValid ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}`}>
            {(pctTotal * 100).toFixed(1)}% total {pctValid ? "✓" : "⚠ debe ser 100%"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="% Meta Suite" id="pctInstagram" type="number" min="0" max="1" step="0.01" value={form.pctInstagram} onChange={set("pctInstagram")} hint="Ej: 0.30 = 30%" />
          <Field label="% PILAS.COL" id="pctFacebook" type="number" min="0" max="1" step="0.01" value={form.pctFacebook} onChange={set("pctFacebook")} />
          <Field label="% Youtube" id="pctGoogleSearch" type="number" min="0" max="1" step="0.01" value={form.pctGoogleSearch} onChange={set("pctGoogleSearch")} />
          <Field label="% Google Display" id="pctGoogleDisplay" type="number" min="0" max="1" step="0.01" value={form.pctGoogleDisplay} onChange={set("pctGoogleDisplay")} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">CPM proyectado por canal (COP)</h2>
        <p className="text-xs text-muted-foreground">Costo por mil impresiones estimado para calcular proyecciones.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CPM Meta Suite" id="cpmInstagram" type="number" min="0" step="100" value={form.cpmInstagram} onChange={set("cpmInstagram")} />
          <Field label="CPM PILAS.COL" id="cpmFacebook" type="number" min="0" step="100" value={form.cpmFacebook} onChange={set("cpmFacebook")} />
          <Field label="CPM Youtube" id="cpmGoogleSearch" type="number" min="0" step="100" value={form.cpmGoogleSearch} onChange={set("cpmGoogleSearch")} />
          <Field label="CPM Google Display" id="cpmGoogleDisplay" type="number" min="0" step="100" value={form.cpmGoogleDisplay} onChange={set("cpmGoogleDisplay")} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">CTR proyectado por canal</h2>
        <p className="text-xs text-muted-foreground">Tasa de clics esperada. Se usa como benchmark en el semáforo de rendimiento.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CTR Meta Suite" id="ctrInstagram" type="number" min="0" max="1" step="0.001" value={form.ctrInstagram} onChange={set("ctrInstagram")} hint="Ej: 0.018 = 1.8%" />
          <Field label="CTR PILAS.COL" id="ctrFacebook" type="number" min="0" max="1" step="0.001" value={form.ctrFacebook} onChange={set("ctrFacebook")} />
          <Field label="CTR Youtube" id="ctrGoogleSearch" type="number" min="0" max="1" step="0.001" value={form.ctrGoogleSearch} onChange={set("ctrGoogleSearch")} />
          <Field label="CTR Google Display" id="ctrGoogleDisplay" type="number" min="0" max="1" step="0.001" value={form.ctrGoogleDisplay} onChange={set("ctrGoogleDisplay")} />
        </div>
      </div>

      <button
        onClick={handleSave}
        data-testid="btn-save-settings"
        disabled={createCampaign.isPending || updateCampaign.isPending || !pctValid}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {createCampaign.isPending || updateCampaign.isPending ? "Guardando…" : campaign ? "Actualizar campaña" : "Crear campaña"}
      </button>
    </div>
  );
}