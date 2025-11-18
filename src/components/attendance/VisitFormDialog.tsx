import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { FRECUENCIAS_DECLARADAS } from "@/lib/attendance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const visitaSchema = z.object({
  nombre: z.string().min(3, "Ingresa al menos 3 caracteres"),
  rut: z
    .string()
    .min(6, "El RUT/ID debe tener al menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  frecuencia: z.string({ required_error: "Selecciona una frecuencia" }),
  tipoRegistro: z.enum(["visita", "miembro"]).default("visita"),
});

export type VisitFormValues = z.infer<typeof visitaSchema>;

interface Props {
  onCreated?: () => void;
}

const buildVisitRut = (rut?: string | null) => {
  if (rut && rut.trim().length > 0) return rut.trim();
  const globalCrypto = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (globalCrypto?.randomUUID) {
    return `VISITA-${globalCrypto.randomUUID()}`;
  }
  return `VISITA-${Date.now()}`;
};

export const VisitFormDialog = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      nombre: "",
      rut: "",
      frecuencia: "ocasional",
      tipoRegistro: "visita",
    },
  });

  const onSubmit = async (values: VisitFormValues) => {
    try {
      setSaving(true);
      const payload = {
        nombre: values.nombre.trim(),
        rut: buildVisitRut(values.rut),
        frecuencia_declarada: values.frecuencia,
        tipo_registro: values.tipoRegistro,
        es_activo: true,
      };
      const { error } = await supabase.from("miembros").insert(payload);
      if (error) throw error;
      toast.success("Visita registrada correctamente");
      setOpen(false);
      form.reset({ nombre: "", rut: "", frecuencia: "ocasional", tipoRegistro: "visita" });
      onCreated?.();
    } catch (error) {
      console.error(error);
      toast.error("No fue posible guardar la visita");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Agregar visita
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva visita</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT o identificador (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="11111111-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frecuencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia declarada</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FRECUENCIAS_DECLARADAS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipoRegistro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="miembro">Miembro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
