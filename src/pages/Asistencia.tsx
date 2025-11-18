import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Search,
  Download,
  ShieldAlert,
  RefreshCw,
  Users,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MemberHistoryDialog } from "@/components/attendance/MemberHistoryDialog";
import { VisitFormDialog } from "@/components/attendance/VisitFormDialog";
import {
  FRECUENCIAS_DECLARADAS,
  getCultoInfo,
  formatRelativeDate,
  buildAttendanceCsv,
} from "@/lib/attendance";
import type { AttendanceCsvRecord, DiaCulto } from "@/lib/attendance";

const bypassAdmin = import.meta.env.VITE_BYPASS_ADMIN === "true";

type Member = Tables<"miembros"> & { ultima_asistencia?: string | null };

type AsistenciaResumen = Tables<"asistencias_por_persona">;

type AttendanceLast60 = Tables<"asistencias_ultimos_60_dias">;

type Falta = Tables<"faltas_consecutivas">;

const fetchMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from("miembros")
    .select("id, nombre, rut, frecuencia_declarada, tipo_registro, es_activo")
    .eq("es_activo", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
};

const fetchResumen = async (): Promise<AsistenciaResumen[]> => {
  const { data, error } = await supabase.from("asistencias_por_persona").select("*");
  if (error) throw error;
  return data ?? [];
};

const fetchLast60 = async (): Promise<AttendanceLast60[]> => {
  const { data, error } = await supabase
    .from("asistencias_ultimos_60_dias")
    .select("*")
    .order("fecha_culto", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

const fetchFaltas = async (): Promise<Falta[]> => {
  const { data, error } = await supabase.from("faltas_consecutivas").select("*");
  if (error) throw error;
  return data ?? [];
};

const useAdminSession = () => {
  const [status, setStatus] = useState<"checking" | "granted" | "denied">(bypassAdmin ? "granted" : "checking");

  useEffect(() => {
    if (bypassAdmin) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const isAdmin = checkAdmin(data.session?.user);
      setStatus(isAdmin ? "granted" : "denied");
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAdmin = checkAdmin(session?.user);
      setStatus(isAdmin ? "granted" : "denied");
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return status;
};

const checkAdmin = (user?: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null) => {
  if (!user) return false;
  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const roles = Array.isArray(appMetadata.roles)
    ? (appMetadata.roles as string[])
    : typeof appMetadata.role === "string"
      ? [appMetadata.role]
      : [];
  if (roles.includes("admin")) return true;
  const customRole = userMetadata.role as string | undefined;
  return customRole === "admin";
};

const Asistencia = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [frequencyLoading, setFrequencyLoading] = useState<Record<number, boolean>>({});
  const [ipInfo, setIpInfo] = useState<{ ip: string | null; userAgent: string | null }>({
    ip: null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });
  const [lastSavedCulto, setLastSavedCulto] = useState<{ fecha: string; dia: DiaCulto } | null>(null);

  const status = useAdminSession();
  const queryClient = useQueryClient();

  const miembrosQuery = useQuery({
    queryKey: ["miembros-activos"],
    queryFn: fetchMembers,
  });

  const resumenQuery = useQuery({
    queryKey: ["asistencias-resumen"],
    queryFn: fetchResumen,
  });

  const last60Query = useQuery({
    queryKey: ["asistencias-60"],
    queryFn: fetchLast60,
  });

  const faltasQuery = useQuery({
    queryKey: ["faltas-consecutivas"],
    queryFn: fetchFaltas,
    refetchInterval: 1000 * 60 * 10,
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api64.ipify.org?format=json", { signal: controller.signal });
        if (!response.ok) throw new Error("ip");
        const payload = (await response.json()) as { ip: string };
        setIpInfo((prev) => ({ ...prev, ip: payload.ip }));
      } catch (error) {
        console.warn("No fue posible obtener la IP", error);
      }
    };
    fetchIp();
    return () => controller.abort();
  }, []);

  const asistenciaMap = useMemo(() => {
    const map = new Map<string, AsistenciaResumen>();
    resumenQuery.data?.forEach((row) => {
      if (!row) return;
      const key = row.rut ?? `SIN-RUT-${row.nombre}`;
      map.set(key, row);
    });
    return map;
  }, [resumenQuery.data]);

  const miembros = useMemo<Member[]>(() => {
    if (!miembrosQuery.data) return [];
    return miembrosQuery.data.map((member) => {
      const key = member.rut ?? `SIN-RUT-${member.nombre}`;
      const resumen = asistenciaMap.get(key);
      return { ...member, ultima_asistencia: resumen?.ultima_asistencia ?? null };
    });
  }, [miembrosQuery.data, asistenciaMap]);

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return miembros;
    return miembros.filter((member) => {
      const hayNombre = member.nombre.toLowerCase().includes(value);
      const hayRut = member.rut?.toLowerCase().includes(value);
      const hayFrecuencia = member.frecuencia_declarada?.toLowerCase().includes(value);
      return hayNombre || hayRut || hayFrecuencia;
    });
  }, [miembros, search]);

  const presentCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const cultoInfo = useMemo(() => getCultoInfo(), []);

  const toggleMember = (memberId: number, checked: boolean | "indeterminate") => {
    setSelected((prev) => ({ ...prev, [memberId]: checked === true }));
  };

  const toggleFiltered = () => {
    if (!filteredMembers.length) return;
    const shouldSelectAll = filteredMembers.some((member) => !selected[member.id]);
    const copy = { ...selected };
    filteredMembers.forEach((member) => {
      copy[member.id] = shouldSelectAll;
    });
    setSelected(copy);
  };

  const handleFrequencyChange = async (memberId: number, value: string) => {
    setFrequencyLoading((prev) => ({ ...prev, [memberId]: true }));
    try {
      const { error } = await supabase
        .from("miembros")
        .update({ frecuencia_declarada: value })
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Frecuencia actualizada");
      queryClient.invalidateQueries({ queryKey: ["miembros-activos"] });
      queryClient.invalidateQueries({ queryKey: ["faltas-consecutivas"] });
    } catch (error) {
      console.error(error);
      toast.error("No pudimos actualizar la frecuencia");
    } finally {
      setFrequencyLoading((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleSave = async () => {
    if (!presentCount) {
      toast.warning("Selecciona al menos una persona");
      return;
    }
    try {
      setSaving(true);
      const payload = miembros
        .filter((member) => selected[member.id])
        .map<AttendanceCsvRecord>((member) => ({
          rut: member.rut ?? `VISITA-${member.id}`,
          nombre: member.nombre,
          fecha_registro: new Date().toISOString(),
          fecha_culto: cultoInfo.fechaCulto,
          dia_semana_culto: cultoInfo.diaCulto,
          asistio: true,
          frecuencia_declarada: member.frecuencia_declarada,
          tipo_registro: member.tipo_registro,
        }));

      const registros = payload.map((row) => ({
        ...row,
        ip_registro: ipInfo.ip,
        user_agent: ipInfo.userAgent,
      }));

      const { error } = await supabase
        .from("asistencias")
        .upsert(registros, { onConflict: "rut,fecha_culto" });
      if (error) throw error;
      toast.success("Asistencia guardada");
      setSelected({});
      setLastSavedCulto({ fecha: cultoInfo.fechaCulto, dia: cultoInfo.diaCulto });
      queryClient.invalidateQueries({ queryKey: ["asistencias-resumen"] });
      queryClient.invalidateQueries({ queryKey: ["asistencias-60"] });
      queryClient.invalidateQueries({ queryKey: ["faltas-consecutivas"] });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "No pudimos guardar";
      toast.error(message.includes("duplicate") ? "Ya existe un registro para esta persona" : message);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const data = last60Query.data;
    if (!data?.length) {
      toast.info("No hay registros en los últimos 60 días");
      return;
    }
    const csv = buildAttendanceCsv(
      data.map((row) => ({
        rut: row.rut,
        nombre: row.nombre ?? "",
        fecha_registro: row.fecha_registro ?? "",
        fecha_culto: row.fecha_culto ?? "",
        dia_semana_culto: row.dia_semana_culto ?? "",
        asistio: Boolean(row.asistio),
        frecuencia_declarada: row.frecuencia_declarada,
        tipo_registro: row.tipo_registro,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencias-${cultoInfo.fechaCulto}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando permisos...
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="text-muted-foreground max-w-md">
          Esta página solo está disponible para administradores de la iglesia. Inicia sesión con un usuario autorizado para
          continuar.
        </p>
      </div>
    );
  }

  const loading = miembrosQuery.isLoading || resumenQuery.isLoading;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex flex-wrap gap-3 items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sistema oficial IETQ</p>
            <h1 className="text-2xl font-semibold">Registro de asistencia</h1>
            <p className="text-xs text-muted-foreground">
              Detectado automáticamente: culto de {cultoInfo.diaCulto} ({cultoInfo.fechaCulto})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                Volver al dashboard
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => miembrosQuery.refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refrescar
            </Button>
            <VisitFormDialog onCreated={() => miembrosQuery.refetch()} />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preparar registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, RUT o frecuencia"
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={toggleFiltered} disabled={!filteredMembers.length}>
                Seleccionar resultados
              </Button>
              <div className="text-sm text-muted-foreground">
                {miembros.length} personas activas · {presentCount} presentes marcados
              </div>
            </div>
            {lastSavedCulto && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Último guardado: {lastSavedCulto.dia} {lastSavedCulto.fecha}
              </div>
            )}
          </CardContent>
        </Card>

        {faltasQuery.data?.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Alertas automáticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faltasQuery.data.slice(0, 5).map((alerta) => (
                <div
                  key={`${alerta.miembro_id}-${alerta.ultimas_fechas}`}
                  className="flex flex-col gap-1 rounded-lg border p-3 bg-destructive/5"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold">{alerta.nombre}</p>
                      <p className="text-xs text-muted-foreground">{alerta.tipo_alerta}</p>
                    </div>
                    <Badge variant="destructive">{alerta.frecuencia_declarada}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alerta.detalle}</p>
                </div>
              ))}
              {faltasQuery.data.length > 5 && (
                <p className="text-xs text-muted-foreground">Hay {faltasQuery.data.length - 5} alertas adicionales.</p>
              )}
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando miembros activos...
            </div>
          )}
          {!loading && !filteredMembers.length && (
            <p className="text-sm text-muted-foreground">No se encontraron personas para el criterio ingresado.</p>
          )}
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border bg-background p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center"
              >
                <div className="flex items-start gap-4 flex-1">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={selected[member.id] ?? false}
                    onCheckedChange={(value) => toggleMember(member.id, value)}
                    className="h-6 w-6"
                  />
                  <div className="space-y-1">
                    <label htmlFor={`member-${member.id}`} className="font-semibold text-base leading-none">
                      {member.nombre}
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {member.rut ? <span>RUT: {member.rut}</span> : <span>Sin RUT</span>}
                      <span>Última asistencia: {formatRelativeDate(member.ultima_asistencia)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{member.tipo_registro}</Badge>
                      {member.frecuencia_declarada && <Badge>{member.frecuencia_declarada}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className="text-xs text-muted-foreground">Frecuencia declarada</div>
                  <Select
                    value={member.frecuencia_declarada ?? "ocasional"}
                    onValueChange={(value) => handleFrequencyChange(member.id, value)}
                    disabled={frequencyLoading[member.id]}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRECUENCIAS_DECLARADAS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <MemberHistoryDialog rut={member.rut} nombre={member.nombre} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-4 py-3">
        <div className="container mx-auto flex flex-wrap gap-3 items-center justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            {presentCount} seleccionados
          </div>
          <Button onClick={handleSave} disabled={saving || !presentCount} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar asistencia
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Asistencia;
