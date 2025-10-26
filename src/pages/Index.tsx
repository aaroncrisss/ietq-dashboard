import { useEffect, useState } from "react";
import { Users, TrendingUp, Activity, Smartphone, MapPin, Car, Church, RefreshCw } from "lucide-react";
import { fetchMiembrosData, calculateMetrics, MiembroIglesia, DashboardMetrics } from "@/lib/data-iglesia";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { MembersTable } from "@/components/dashboard/MembersTable";
import { Chatbot } from "@/components/dashboard/Chatbot";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = {
  primary: "hsl(220 85% 45%)",
  accent: "hsl(25 95% 55%)",
  secondary: "hsl(220 30% 88%)",
  muted: "hsl(220 20% 92%)",
};

const Index = () => {
  const [miembros, setMiembros] = useState<MiembroIglesia[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMiembrosData();
      setMiembros(data);
      setMetrics(calculateMetrics(data));
      setLastUpdate(new Date());
      toast.success("Datos actualizados correctamente");
    } catch (error) {
      toast.error("Error al cargar los datos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando datos de la iglesia...</p>
        </div>
      </div>
    );
  }

  const generoData = [
    { name: "Masculino", value: metrics.distribucionGenero.masculino },
    { name: "Femenino", value: metrics.distribucionGenero.femenino },
  ];

  const tasaTecnologia = Math.round(metrics.tasaAccesoTecnologia);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-glass backdrop-blur-glass sticky top-0 z-10 shadow-glass">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-primary p-2">
                <Church className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard Iglesia Evangélica</h1>
                <p className="text-sm text-muted-foreground">
                  Última actualización: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              className="gap-2 border-border bg-background/50 hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Main KPI */}
        <div className="animate-fade-in">
          <KPICard
            title="Miembros Activos del Mes"
            value={metrics.miembrosActivos}
            icon={TrendingUp}
            trend={`${Math.round((metrics.miembrosActivos / metrics.totalMiembros) * 100)}% del total`}
            variant="accent"
          />
        </div>

        {/* KPI Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <KPICard
            title="Total Miembros"
            value={metrics.totalMiembros}
            icon={Users}
          />
          <KPICard
            title="Participan en Grupos"
            value={metrics.participantesGrupos}
            icon={Activity}
            trend={`${Math.round((metrics.participantesGrupos / metrics.totalMiembros) * 100)}%`}
          />
          <KPICard
            title="Acceso a Tecnología"
            value={`${tasaTecnologia}%`}
            icon={Smartphone}
          />
          <KPICard
            title="Con Transporte Propio"
            value={metrics.miembrosConTransporte}
            icon={Car}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <ChartCard title="Distribución por Género">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {generoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.primary : COLORS.accent} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribución por Edad">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.distribucionEdad}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 88%)" />
                <XAxis dataKey="rango" stroke="hsl(220 60% 12%)" />
                <YAxis stroke="hsl(220 60% 12%)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(0 0% 100%)", 
                    border: "1px solid hsl(220 30% 88%)",
                    borderRadius: "0.75rem"
                  }} 
                />
                <Bar dataKey="cantidad" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribución por Comuna">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.distribucionComuna.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 30% 88%)" />
                <XAxis type="number" stroke="hsl(220 60% 12%)" />
                <YAxis dataKey="comuna" type="category" stroke="hsl(220 60% 12%)" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(0 0% 100%)", 
                    border: "1px solid hsl(220 30% 88%)",
                    borderRadius: "0.75rem"
                  }} 
                />
                <Bar dataKey="cantidad" fill={COLORS.accent} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Asistencia Regular">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.asistenciaRegular}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {metrics.asistenciaRegular.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 2 === 0 ? COLORS.primary : COLORS.accent} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Members Table */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <MembersTable miembros={miembros} />
        </div>
      </main>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default Index;
