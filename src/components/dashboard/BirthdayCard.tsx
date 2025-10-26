import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake } from "lucide-react";

interface Birthday {
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  dia: string;
}

interface BirthdayCardProps {
  cumpleanos: Birthday[];
}

export function BirthdayCard({ cumpleanos }: BirthdayCardProps) {
  return (
    <Card className="border-0 shadow-glass backdrop-blur-glass bg-gradient-glass">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg font-semibold">
            Cumpleaños de la Semana
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {cumpleanos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay cumpleaños esta semana
          </p>
        ) : (
          <div className="space-y-3">
            {cumpleanos.map((persona, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-accent p-2">
                    <Cake className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{persona.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {persona.dia} - {persona.edad + 1} años
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-accent">
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
