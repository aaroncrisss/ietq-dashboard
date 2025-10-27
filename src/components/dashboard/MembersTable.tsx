import { useState } from "react";
import { MiembroIglesia } from "@/lib/data-iglesia";
import { normalizeMinisterios, MINISTERIOS_VALIDOS } from "@/lib/ministerios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberDetailDrawer } from "./MemberDetailDrawer";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembersTableProps {
  miembros: MiembroIglesia[];
}

export function MembersTable({ miembros }: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMinisterios, setSelectedMinisterios] = useState<string[]>([]);
  
  const toggleMinisterio = (ministerio: string) => {
    setSelectedMinisterios(prev =>
      prev.includes(ministerio)
        ? prev.filter(m => m !== ministerio)
        : [...prev, ministerio]
    );
  };

  const filteredMiembros = miembros.filter(m => {
    const matchesSearch = 
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.comunaResidencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.participaGrupos.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (selectedMinisterios.length === 0) return true;
    
    const ministerios = normalizeMinisterios(m.participaGrupos);
    return selectedMinisterios.some(sm => ministerios.includes(sm));
  });
  
  return (
    <Card className="border-0 shadow-glass backdrop-blur-glass bg-gradient-glass hover-scale transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Miembros y Ministerios</CardTitle>
        
        {/* Buscador */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, comuna o ministerio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filtros por Ministerio */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Filtrar por ministerio:</p>
          <div className="flex flex-wrap gap-2">
            {MINISTERIOS_VALIDOS.map(ministerio => (
              <div key={ministerio} className="flex items-center gap-2">
                <Checkbox
                  id={ministerio}
                  checked={selectedMinisterios.includes(ministerio)}
                  onCheckedChange={() => toggleMinisterio(ministerio)}
                />
                <label
                  htmlFor={ministerio}
                  className="text-sm cursor-pointer select-none"
                >
                  {ministerio}
                </label>
              </div>
            ))}
            {selectedMinisterios.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMinisterios([])}
                className="h-6 text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Nombre</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Comuna</TableHead>
                <TableHead>Ministerios</TableHead>
                <TableHead>Asistencia</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMiembros.slice(0, 10).map((miembro, idx) => {
                const ministerios = normalizeMinisterios(miembro.participaGrupos);
                return (
                  <TableRow 
                    key={idx} 
                    className="border-border hover:bg-primary/5 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <TableCell className="font-medium">{miembro.nombre}</TableCell>
                    <TableCell>{miembro.edad}</TableCell>
                    <TableCell>{miembro.comunaResidencia}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ministerios.length > 0 ? (
                          ministerios.map((ministerio, midx) => (
                            <Badge
                              key={midx}
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/30 text-xs hover:bg-primary/20 transition-colors"
                            >
                              {ministerio}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                        {miembro.diasAsistencia}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <MemberDetailDrawer miembro={miembro} ministerios={ministerios}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                      </MemberDetailDrawer>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filteredMiembros.length > 10 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Mostrando 10 de {filteredMiembros.length} miembros
          </p>
        )}
        {filteredMiembros.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No se encontraron resultados
          </p>
        )}
      </CardContent>
    </Card>
  );
}
