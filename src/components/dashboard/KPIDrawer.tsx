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
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KPIDrawerProps {
  miembros: MiembroIglesia[];
  title: string;
  description: string;
  filterFn: (miembro: MiembroIglesia) => boolean;
  renderItem: (miembro: MiembroIglesia, idx: number) => React.ReactNode;
  children: React.ReactNode;
}

export function KPIDrawer({ miembros, title, description, filterFn, renderItem, children }: KPIDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = miembros
    .filter(filterFn)
    .filter(m =>
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
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
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
              className="pl-10 bg-background/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            {filteredMembers.map((miembro, idx) => renderItem(miembro, idx))}
            {filteredMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron resultados
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
