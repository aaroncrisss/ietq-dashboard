import { useState } from "react";
import { MiembroIglesia } from "@/lib/data-iglesia";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MembersTableProps {
  miembros: MiembroIglesia[];
}

export function MembersTable({ miembros }: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredMiembros = miembros.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.comunaResidencia.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card className="border-0 shadow-glass backdrop-blur-glass bg-gradient-glass">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tabla de Miembros</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o comuna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border"
          />
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
                <TableHead>Asistencia</TableHead>
                <TableHead>Participa Grupos</TableHead>
                <TableHead>Transporte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMiembros.slice(0, 10).map((miembro, idx) => (
                <TableRow key={idx} className="border-border hover:bg-primary/5 transition-colors">
                  <TableCell className="font-medium">{miembro.nombre}</TableCell>
                  <TableCell>{miembro.edad}</TableCell>
                  <TableCell>{miembro.comunaResidencia}</TableCell>
                  <TableCell className="text-xs">{miembro.diasAsistencia}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      miembro.participaGrupos.toLowerCase().includes('si')
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {miembro.participaGrupos.toLowerCase().includes('si') ? 'Sí' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      miembro.tieneTransporte.toLowerCase().includes('si')
                        ? 'bg-accent/10 text-accent'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {miembro.tieneTransporte.toLowerCase().includes('si') ? 'Sí' : 'No'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredMiembros.length > 10 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Mostrando 10 de {filteredMiembros.length} miembros
          </p>
        )}
      </CardContent>
    </Card>
  );
}
