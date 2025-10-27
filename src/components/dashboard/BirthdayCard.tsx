import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Cake, Search } from "lucide-react";
import type { MiembroIglesia } from "@/lib/data-iglesia";

interface Birthday {
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  dia: string;
  date: Date;
  isPast: boolean;
}

interface BirthdayCardProps {
  cumpleanos: Birthday[];
  todosLosMiembros: MiembroIglesia[];
}

export function BirthdayCard({ cumpleanos, todosLosMiembros }: BirthdayCardProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCumpleanos = useMemo(() => {
    if (!searchTerm.trim()) {
      return cumpleanos;
    }

    // Buscar en todos los miembros
    const searchLower = searchTerm.toLowerCase();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return todosLosMiembros
      .filter(m => m.nombre.toLowerCase().includes(searchLower) && m.fechaNacimiento?.trim())
      .map(m => {
        const fechaParts = m.fechaNacimiento.split('/');
        if (fechaParts.length !== 3) return null;
        
        const dia = parseInt(fechaParts[0]);
        const mes = parseInt(fechaParts[1]);
        
        if (isNaN(dia) || isNaN(mes)) return null;
        
        const cumpleañosEsteAño = new Date(hoy.getFullYear(), mes - 1, dia);
        cumpleañosEsteAño.setHours(0, 0, 0, 0);
        
        if (cumpleañosEsteAño < hoy) {
          cumpleañosEsteAño.setFullYear(hoy.getFullYear() + 1);
        }
        
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const isPast = cumpleañosEsteAño <= hoy;
        
        return {
          nombre: m.nombre,
          fechaNacimiento: m.fechaNacimiento,
          edad: m.edad,
          dia: dias[cumpleañosEsteAño.getDay()],
          date: cumpleañosEsteAño,
          isPast
        };
      })
      .filter((c): c is Birthday => c !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [searchTerm, cumpleanos, todosLosMiembros]);

  return (
    <Card className="border-0 shadow-glass backdrop-blur-glass bg-gradient-glass hover-scale transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-xl bg-gradient-accent p-2 animate-pulse-subtle">
            <Cake className="h-5 w-5 text-accent-foreground" />
          </div>
          <CardTitle className="text-lg font-semibold">
            Cumpleaños de la Semana
          </CardTitle>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cumpleañero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredCumpleanos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {searchTerm ? "No se encontraron resultados" : "No hay cumpleaños esta semana"}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredCumpleanos.map((persona, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] animate-fade-in ${
                  persona.isPast
                    ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                    : "bg-accent/5 border-accent/10 hover:bg-accent/10 hover:shadow-glow"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    persona.isPast ? "bg-green-500/20" : "bg-gradient-accent"
                  }`}>
                    <Cake className={`h-4 w-4 ${
                      persona.isPast ? "text-green-600" : "text-accent-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{persona.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {persona.dia} - {persona.edad + 1} años
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${
                    persona.isPast ? "text-green-600" : "text-accent"
                  }`}>
                    {persona.fechaNacimiento.split('/').slice(0, 2).join('/')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
