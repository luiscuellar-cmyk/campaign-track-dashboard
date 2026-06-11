import { useState, useRef } from "react";
import { useCampaignStore, useDailyActuals, useUpsertActual, useBulkUpsertActuals, useClearActuals } from "@/hooks/useCampaignStore";
import { buildDayData, fmtCOP, CHANNEL_META } from "@/lib/campaign-utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Upload, Table2, Trash2, Save, AlertCircle } from "lucide-react";
import type { InsertDailyActual } from "@shared/schema";

// ─── Single day inline editor ──────────────────────────────────────
function DayRow({ day, date, actual, onSave, isSaving }: {
  day: number; date: string;
  actual: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [vals, setVals] = useState({
    spendInstagram: actual?.spendInstagram ?? 0,
    spendFacebook: actual?.spendFacebook ?? 0,
    spendGoogleSearch: actual?.spendGoogleSearch ?? 0,
    spendGoogleDisplay: actual?.spendGoogleDisplay ?? 0,
    impInstagram: actual?.impInstagram ?? 0,
    impFacebook: actual?.impFacebook ?? 0,
    impGoogleSearch: actual?.impGoogleSearch ?? 0,
    impGoogleDisplay: actual?.impGoogleDisplay ?? 0,
    clicksInstagram: actual?.clicksInstagram ?? 0,
    clicksFacebook: actual?.clicksFacebook ?? 0,
    clicksGoogleSearch: actual?.clicksGoogleSearch ?? 0,
    clicksGoogleDisplay: actual?.clicksGoogleDisplay ?? 0,
    reachInstagram: actual?.reachInstagram ?? 0,
    reachFacebook: actual?.reachFacebook ?? 0,
    reachGoogleSearch: actual?.reachGoogleSearch ?? 0,
    reachGoogleDisplay: actual?.reachGoogleDisplay ?? 0,
  });

  const [expanded, setExpanded] = useState(false);
  const hasData = actual && (actual.spendInstagram + actual.spendFacebook + actual.spendGoogleSearch + actual.spendGoogleDisplay) > 0;
  const totalSpend = vals.spendInstagram + vals.spendFacebook + vals.spendGoogleSearch + vals.spendGoogleDisplay;

  const field = (key: keyof typeof vals) => (
    <input
      data-testid={`input-${key}-day${day}`}
      type="number"
      min="0"
      step="1000"
      value={vals[key] === 0 && !hasData ? "" : vals[key]}
      placeholder="0"
      onChange={e => setVals(v => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))}
      className="w-full text-right text-xs tabular bg-background border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
    />
  );

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded(e => !e)}
        data-testid={`btn-expand-day${day}`}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">D{day}</span>
          <div>
            <span className="text-sm font-medium text-foreground">{date}</span>
            {hasData && <span className="ml-2 text-xs text-green-500 font-medium">✓ {fmtCOP(totalSpend)}</span>}
            {!hasData && <span className="ml-2 text-xs text-muted-foreground">Sin datos</span>}
          </div>
        </div>
        <span className="text-muted-foreground text-lg">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left pb-2 font-medium w-28">Canal</th>
                  <th className="text-right pb-2 font-medium">Inversión (COP)</th>
                  <th className="text-right pb-2 font-medium">Impresiones</th>
                  <th className="text-right pb-2 font-medium">Clicks</th>
                  <th className="text-right pb-2 font-medium">Alcance</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {[
                  { label: "Meta Suite", color: "#E1306C", spendKey: "spendInstagram", impKey: "impInstagram", clkKey: "clicksInstagram", reachKey: "reachInstagram" },
                  { label: "PILAS.COL", color: "#1877F2", spendKey: "spendFacebook", impKey: "impFacebook", clkKey: "clicksFacebook", reachKey: "reachFacebook" },
                  { label: "Youtube", color: "#34A853", spendKey: "spendGoogleSearch", impKey: "impGoogleSearch", clkKey: "clicksGoogleSearch", reachKey: "reachGoogleSearch" },
                  { label: "Google Display", color: "#FBBC05", spendKey: "spendGoogleDisplay", impKey: "impGoogleDisplay", clkKey: "clicksGoogleDisplay", reachKey: "reachGoogleDisplay" },
                ].map(({ label, color, spendKey, impKey, clkKey, reachKey }) => (
                  <tr key={label}>
                    <td className="py-1.5 pr-3">
                      <span className="font-semibold" style={{ color }}>{label}</span>
                    </td>
                    <td className="py-1.5 px-1">{field(spendKey as keyof typeof vals)}</td>
                    <td className="py-1.5 px-1">{field(impKey as keyof typeof vals)}</td>
                    <td className="py-1.5 px-1">{field(clkKey as keyof typeof vals)}</td>
                    <td className="py-1.5 px-1">{field(reachKey as keyof typeof vals)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-3">
            <button
              data-testid={`btn-save-day${day}`}
              onClick={() => onSave({ ...vals, day, date })}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save size={12} />
              {isSaving ? "Guardando…" : "Guardar Día"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Paste CSV parser ──────────────────────────────────────────────
function parsePastedCSV(text: string): Omit<InsertDailyActual, "campaignId">[] | null {
  try {
    const lines = text.trim().split("\n").filter(l => l.trim());
    // Skip header if first line contains non-numeric in col 0
    const dataLines = isNaN(Number(lines[0].split(/[,;\t]/)[0])) ? lines.slice(1) : lines;
    return dataLines.map(line => {
      const cols = line.split(/[,;\t]/).map(c => c.trim());
      // Expected: day, date, ig_spend, fb_spend, gs_spend, gd_spend, ig_imp, fb_imp, gs_imp, gd_imp, ig_clk, fb_clk, gs_clk, gd_clk
      return {
        day: parseInt(cols[0]) || 0,
        date: cols[1] || undefined,
        spendInstagram: parseFloat(cols[2]) || 0,
        spendFacebook: parseFloat(cols[3]) || 0,
        spendGoogleSearch: parseFloat(cols[4]) || 0,
        spendGoogleDisplay: parseFloat(cols[5]) || 0,
        impInstagram: parseFloat(cols[6]) || 0,
        impFacebook: parseFloat(cols[7]) || 0,
        impGoogleSearch: parseFloat(cols[8]) || 0,
        impGoogleDisplay: parseFloat(cols[9]) || 0,
        clicksInstagram: parseFloat(cols[10]) || 0,
        clicksFacebook: parseFloat(cols[11]) || 0,
        clicksGoogleSearch: parseFloat(cols[12]) || 0,
        clicksGoogleDisplay: parseFloat(cols[13]) || 0,
        reachInstagram: parseFloat(cols[14]) || 0,
        reachFacebook: parseFloat(cols[15]) || 0,
        reachGoogleSearch: parseFloat(cols[16]) || 0,
        reachGoogleDisplay: parseFloat(cols[17]) || 0,
      };
    });
  } catch {
    return null;
  }
}

export default function DataEntryPage() {
  const { campaign } = useCampaignStore();
  const { data: actuals = [], isLoading } = useDailyActuals(campaign?.id);
  const upsertActual = useUpsertActual(campaign?.id ?? 0);
  const bulkUpsert = useBulkUpsertActuals(campaign?.id ?? 0);
  const clearActuals = useClearActuals(campaign?.id ?? 0);
  const { toast } = useToast();
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<ReturnType<typeof parsePastedCSV>>(null);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!campaign) return (
    <div className="flex items-center justify-center h-full p-8 text-center">
      <p className="text-muted-foreground">Configura una campaña primero en Configuración.</p>
    </div>
  );

  if (isLoading) return <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  const daysCount = campaign.durationDays;
  const startDate = new Date(campaign.startDate);

  const getDayDate = (day: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + day - 1);
    return d.toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short" });
  };

  const handleSaveDay = async (day: number, data: any) => {
    setSavingDay(day);
    try {
      await upsertActual.mutateAsync({ ...data, day });
      toast({ title: `Día ${day} guardado`, description: `Datos del ${getDayDate(day)} actualizados.` });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    } finally {
      setSavingDay(null);
    }
  };

  const handleCsvPreview = () => {
    const parsed = parsePastedCSV(csvText);
    if (!parsed || parsed.length === 0) {
      toast({ title: "Formato inválido", description: "Revisa el formato del CSV.", variant: "destructive" });
      return;
    }
    setCsvPreview(parsed);
  };

  const handleCsvImport = async () => {
    if (!csvPreview) return;
    try {
      await bulkUpsert.mutateAsync(csvPreview);
      toast({ title: `${csvPreview.length} días importados`, description: "Datos cargados exitosamente." });
      setCsvText("");
      setCsvPreview(null);
    } catch {
      toast({ title: "Error al importar", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const parsed = parsePastedCSV(text);
      if (parsed) setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (!confirm("¿Borrar todos los datos reales de la campaña?")) return;
    await clearActuals.mutateAsync();
    toast({ title: "Datos borrados" });
  };

  const CSV_TEMPLATE = `día,fecha,metasuite_inversión,pilascol_inversión,youtube_inversión,gd_inversión,metasuite_impresiones,pilascol_impresiones,youtube_impresiones,gd_impresiones,metasuite_clicks,pilascol_clicks,youtube_clicks,gd_clicks,metasuite_alcance,pilascol_alcance,youtube_alcance,gd_alcance
1,09/06/2026,300000,250000,300000,150000,40000,41666,60000,42857,720,625,2700,342,35000,38000,55000,40000
2,10/06/2026,300000,250000,300000,150000,40000,41666,60000,42857,720,625,2700,342,35000,38000,55000,40000`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Ingreso de datos diarios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {actuals.length} de {daysCount} días con datos
          </p>
        </div>
        <button
          onClick={handleClear}
          data-testid="btn-clear-all"
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={12} />
          Limpiar todo
        </button>
      </div>

      <Tabs defaultValue="manual">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="manual" data-testid="tab-manual">Manual</TabsTrigger>
          <TabsTrigger value="csv" data-testid="tab-csv">CSV / Pegar</TabsTrigger>
        </TabsList>

        {/* MANUAL ENTRY */}
        <TabsContent value="manual" className="mt-4 space-y-3">
          {Array.from({ length: daysCount }, (_, i) => i + 1).map(day => (
            <DayRow
              key={day}
              day={day}
              date={getDayDate(day)}
              actual={actuals.find(a => a.day === day)}
              onSave={data => handleSaveDay(day, data)}
              isSaving={savingDay === day}
            />
          ))}
        </TabsContent>

        {/* CSV ENTRY */}
        <TabsContent value="csv" className="mt-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Upload size={14} />
              Cargar o pegar CSV
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              14 columnas de datos + 4 columnas de alcance separadas por coma, punto y coma o tabulación:<br />
              <code className="bg-muted px-1 py-0.5 rounded text-xs">día, fecha, ig_inv, fb_inv, gs_inv, gd_inv, ig_imp, fb_imp, gs_imp, gd_imp, ig_clk, fb_clk, gs_clk, gd_clk, ig_alcance, fb_alcance, gs_alcance, gd_alcance</code>
            </p>

            {/* Upload button */}
            <div className="flex gap-3 mb-4">
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                data-testid="btn-upload-csv"
                className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors border border-border"
              >
                <Upload size={12} />
                Subir archivo .csv
              </button>
              <button
                onClick={() => { setCsvText(CSV_TEMPLATE); setCsvPreview(null); }}
                className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-xs hover:bg-muted/80 transition-colors border border-border"
              >
                Ver plantilla
              </button>
            </div>

            {/* Textarea */}
            <textarea
              data-testid="input-csv-paste"
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setCsvPreview(null); }}
              placeholder="Pega aquí tus datos CSV o usa el botón de carga…"
              rows={8}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />

            <div className="flex gap-3 mt-3">
              <button
                data-testid="btn-preview-csv"
                onClick={handleCsvPreview}
                disabled={!csvText.trim()}
                className="px-4 py-2 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-colors border border-border disabled:opacity-50"
              >
                Vista previa
              </button>
              {csvPreview && (
                <button
                  data-testid="btn-import-csv"
                  onClick={handleCsvImport}
                  disabled={bulkUpsert.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={12} />
                  {bulkUpsert.isPending ? "Importando…" : `Importar ${csvPreview.length} días`}
                </button>
              )}
            </div>
          </div>

          {/* CSV Preview table */}
          {csvPreview && (
            <div className="bg-card border border-border rounded-xl p-5 overflow-x-auto">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Table2 size={14} />
                Vista previa — {csvPreview.length} filas detectadas
              </h3>
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 pr-3 font-medium">Día</th>
                    <th className="text-right pb-2 px-2 font-medium text-[#E1306C]">Meta S. Inv.</th>
                    <th className="text-right pb-2 px-2 font-medium text-[#1877F2]">PILAS Inv.</th>
                    <th className="text-right pb-2 px-2 font-medium text-[#34A853]">YT Inv.</th>
                    <th className="text-right pb-2 px-2 font-medium text-[#FBBC05]">GD Inv.</th>
                    <th className="text-right pb-2 px-2 font-medium">Total</th>
                    <th className="text-right pb-2 pl-2 font-medium">Imp.</th>
                    <th className="text-right pb-2 pl-2 font-medium">Clicks</th>
                    <th className="text-right pb-2 pl-2 font-medium">Alcance</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 17).map(row => (
                    <tr key={row.day} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-1.5 pr-3 font-semibold">D{row.day}</td>
                      <td className="py-1.5 px-2 text-right tabular">{fmtCOP(row.spendInstagram)}</td>
                      <td className="py-1.5 px-2 text-right tabular">{fmtCOP(row.spendFacebook)}</td>
                      <td className="py-1.5 px-2 text-right tabular">{fmtCOP(row.spendGoogleSearch)}</td>
                      <td className="py-1.5 px-2 text-right tabular">{fmtCOP(row.spendGoogleDisplay)}</td>
                      <td className="py-1.5 px-2 text-right tabular font-semibold">
                        {fmtCOP(row.spendInstagram + row.spendFacebook + row.spendGoogleSearch + row.spendGoogleDisplay)}
                      </td>
                      <td className="py-1.5 pl-2 text-right tabular text-muted-foreground">
                        {(row.impInstagram + row.impFacebook + row.impGoogleSearch + row.impGoogleDisplay).toLocaleString("es-CO")}
                      </td>
                      <td className="py-1.5 pl-2 text-right tabular text-muted-foreground">
                        {(row.clicksInstagram + row.clicksFacebook + row.clicksGoogleSearch + row.clicksGoogleDisplay).toLocaleString("es-CO")}
                      </td>
                      <td className="py-1.5 pl-2 text-right tabular text-muted-foreground font-medium">
                        {(row.reachInstagram + row.reachFacebook + row.reachGoogleSearch + row.reachGoogleDisplay).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}