import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, History } from "lucide-react";
import { formatRelativeDate } from "@/lib/attendance";

interface Props {
  rut: string | null;
  nombre: string;
  disabled?: boolean;
}

const fetchHistory = async (rut: string | null, nombre: string) => {
  let query = supabase
    .from("asistencias")
    .select("id, fecha_culto, dia_semana_culto, asistio, fecha_registro")
    .order("fecha_culto", { ascending: false })
    .limit(30);

  if (rut) {
    query = query.eq("rut", rut);
  } else {
    query = query.eq("nombre", nombre);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Pick<
    Tables<"asistencias">,
    "id" | "fecha_culto" | "dia_semana_culto" | "asistio" | "fecha_registro"
  >[];
};

export const MemberHistoryDialog = ({ rut, nombre, disabled }: Props) => {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["historial", rut ?? nombre],
    queryFn: () => fetchHistory(rut, nombre),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={disabled}>
          <History className="h-4 w-4" />
          Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de {nombre}</DialogTitle>
          <DialogDescription>
            Últimas marcas registradas en Supabase
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg">
          <ScrollArea className="max-h-[320px]">
            <div className="divide-y">
              {isLoading && (
                <div className="flex items-center justify-center p-6 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando historial...
                </div>
              )}
              {isError && (
                <div className="p-4 text-sm text-destructive flex flex-col gap-2">
                  Error al cargar el historial.
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Reintentar
                  </Button>
                </div>
              )}
              {!isLoading && !isError && data?.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  Sin registros para mostrar.
                </div>
              )}
              {data?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <p className="font-medium">{formatRelativeDate(item.fecha_culto)}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrado el {formatRelativeDate(item.fecha_registro)}
                    </p>
                  </div>
                  <Badge variant={item.asistio ? "default" : "secondary"}>
                    {item.dia_semana_culto}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
