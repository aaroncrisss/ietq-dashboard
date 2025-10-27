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
import { Badge } from "@/components/ui/badge";
import { User, X, Phone, MapPin, Car, MessageCircle, Calendar } from "lucide-react";

interface MemberDetailDrawerProps {
  miembro: MiembroIglesia;
  ministerios: string[];
  children: React.ReactNode;
}

export function MemberDetailDrawer({ miembro, ministerios, children }: MemberDetailDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-primary p-2">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            {miembro.nombre}
          </DrawerTitle>
          <DrawerDescription>
            Información detallada del miembro
          </DrawerDescription>
          <DrawerClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-6 overflow-y-auto">
          {/* Información Personal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Información Personal
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Edad</p>
                <p className="font-semibold">{miembro.edad} años</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Género</p>
                <p className="font-semibold">{miembro.genero}</p>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contacto
            </h3>
            <div className="space-y-2">
              {miembro.telefono && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{miembro.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{miembro.comunaResidencia}</span>
              </div>
            </div>
          </div>

          {/* Ministerios */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ministerios
            </h3>
            <div className="flex flex-wrap gap-2">
              {ministerios.length > 0 ? (
                ministerios.map((ministerio, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors"
                  >
                    {ministerio}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No participa en ministerios</p>
              )}
            </div>
          </div>

          {/* Asistencia */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Asistencia
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{miembro.diasAsistencia}</span>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Características
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${
                miembro.tieneTransporte.toLowerCase().includes('si')
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-muted/50 border-border'
              }`}>
                <div className="flex items-center gap-2">
                  <Car className={`h-4 w-4 ${
                    miembro.tieneTransporte.toLowerCase().includes('si')
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Transporte</p>
                    <p className="font-semibold text-sm">
                      {miembro.tieneTransporte.toLowerCase().includes('si') ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${
                miembro.tieneWhatsapp.toLowerCase().includes('si')
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-muted/50 border-border'
              }`}>
                <div className="flex items-center gap-2">
                  <MessageCircle className={`h-4 w-4 ${
                    miembro.tieneWhatsapp.toLowerCase().includes('si')
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="font-semibold text-sm">
                      {miembro.tieneWhatsapp.toLowerCase().includes('si') ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
