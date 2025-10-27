import { useState } from "react";
import { MiembroIglesia } from "@/lib/data-iglesia";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Car, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransportDrawerProps {
  miembros: MiembroIglesia[];
  children: React.ReactNode;
}

export function TransportDrawer({ miembros, children }: TransportDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const conTransporte = miembros.filter(m =>
    m.tieneTransporte.toLowerCase().includes('si')
  );

  const sinTransporte = miembros.filter(m =>
    !m.tieneTransporte.toLowerCase().includes('si')
  );

  const filterMembers = (members: MiembroIglesia[]) =>
    members.filter(m =>
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.comunaResidencia.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            Transporte Propio
          </DrawerTitle>
          <DrawerDescription>
            Visualiza quiénes tienen o no tienen vehículo propio
          </DrawerDescription>
          <DrawerClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o comuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border"
            />
          </div>

          <Tabs defaultValue="con-auto" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="con-auto">
                Con Auto ({conTransporte.length})
              </TabsTrigger>
              <TabsTrigger value="sin-auto">
                Sin Auto ({sinTransporte.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="con-auto" className="space-y-2">
              {filterMembers(conTransporte).map((miembro, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div>
                    <p className="font-medium text-foreground">{miembro.nombre}</p>
                    <p className="text-xs text-muted-foreground">{miembro.comunaResidencia}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <Car className="h-3 w-3 mr-1" />
                    Con auto
                  </Badge>
                </div>
              ))}
              {filterMembers(conTransporte).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No se encontraron resultados
                </p>
              )}
            </TabsContent>

            <TabsContent value="sin-auto" className="space-y-2">
              {filterMembers(sinTransporte).map((miembro, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div>
                    <p className="font-medium text-foreground">{miembro.nombre}</p>
                    <p className="text-xs text-muted-foreground">{miembro.comunaResidencia}</p>
                  </div>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Sin auto
                  </Badge>
                </div>
              ))}
              {filterMembers(sinTransporte).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No se encontraron resultados
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
