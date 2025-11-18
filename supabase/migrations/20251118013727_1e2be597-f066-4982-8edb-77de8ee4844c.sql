-- Create members table
CREATE TABLE public.miembros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rut TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  frecuencia_declarada TEXT NOT NULL,
  tipo_registro TEXT NOT NULL CHECK (tipo_registro IN ('miembro', 'visita')),
  es_activo BOOLEAN NOT NULL DEFAULT true,
  ultima_asistencia TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.asistencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_culto DATE NOT NULL,
  dia_semana_culto TEXT NOT NULL,
  asistio BOOLEAN NOT NULL,
  frecuencia_declarada TEXT NOT NULL,
  tipo_registro TEXT NOT NULL,
  ip_registro TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_miembros_rut ON public.miembros(rut);
CREATE INDEX idx_miembros_es_activo ON public.miembros(es_activo);
CREATE INDEX idx_asistencias_rut ON public.asistencias(rut);
CREATE INDEX idx_asistencias_fecha_culto ON public.asistencias(fecha_culto);

-- Create view for attendance by person
CREATE VIEW public.asistencias_por_persona AS
SELECT 
  m.id as miembro_id,
  m.rut,
  m.nombre,
  m.frecuencia_declarada,
  m.tipo_registro,
  COUNT(a.id) as total_asistencias,
  COUNT(CASE WHEN a.asistio THEN 1 END) as asistencias,
  COUNT(CASE WHEN NOT a.asistio THEN 1 END) as faltas,
  MAX(a.fecha_culto) as ultima_fecha
FROM public.miembros m
LEFT JOIN public.asistencias a ON m.rut = a.rut
WHERE m.es_activo = true
GROUP BY m.id, m.rut, m.nombre, m.frecuencia_declarada, m.tipo_registro;

-- Create view for attendance in last 60 days
CREATE VIEW public.asistencias_ultimos_60_dias AS
SELECT 
  fecha_culto,
  COUNT(*) as total,
  COUNT(CASE WHEN asistio THEN 1 END) as presentes,
  COUNT(CASE WHEN NOT asistio THEN 1 END) as ausentes
FROM public.asistencias
WHERE fecha_culto >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY fecha_culto
ORDER BY fecha_culto DESC;

-- Create view for consecutive absences
CREATE VIEW public.faltas_consecutivas AS
WITH ranked_attendance AS (
  SELECT 
    m.id as miembro_id,
    m.nombre,
    m.rut,
    m.frecuencia_declarada,
    a.fecha_culto,
    a.asistio,
    ROW_NUMBER() OVER (PARTITION BY m.id ORDER BY a.fecha_culto DESC) as rn
  FROM public.miembros m
  LEFT JOIN public.asistencias a ON m.rut = a.rut
  WHERE m.es_activo = true
),
consecutive_absences AS (
  SELECT 
    miembro_id,
    nombre,
    rut,
    frecuencia_declarada,
    COUNT(*) as faltas_consecutivas,
    ARRAY_AGG(fecha_culto ORDER BY fecha_culto DESC) as ultimas_fechas
  FROM ranked_attendance
  WHERE rn <= 5 AND (asistio = false OR asistio IS NULL)
  GROUP BY miembro_id, nombre, rut, frecuencia_declarada
)
SELECT 
  miembro_id,
  nombre,
  rut,
  frecuencia_declarada,
  faltas_consecutivas,
  ultimas_fechas,
  CASE 
    WHEN faltas_consecutivas >= 4 THEN 'crítico'
    WHEN faltas_consecutivas >= 2 THEN 'alerta'
    ELSE 'normal'
  END as tipo_alerta,
  CASE 
    WHEN faltas_consecutivas >= 4 THEN faltas_consecutivas || ' faltas consecutivas - Requiere atención urgente'
    WHEN faltas_consecutivas >= 2 THEN faltas_consecutivas || ' faltas consecutivas - Monitorear de cerca'
    ELSE 'Sin faltas significativas'
  END as detalle
FROM consecutive_absences
WHERE faltas_consecutivas >= 2
ORDER BY faltas_consecutivas DESC;

-- Enable Row Level Security
ALTER TABLE public.miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for now - adjust based on your auth needs)
CREATE POLICY "Allow public read access to miembros" 
ON public.miembros FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to miembros" 
ON public.miembros FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to miembros" 
ON public.miembros FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete from miembros" 
ON public.miembros FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access to asistencias" 
ON public.asistencias FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to asistencias" 
ON public.asistencias FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to asistencias" 
ON public.asistencias FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete from asistencias" 
ON public.asistencias FOR DELETE 
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_miembros_updated_at
BEFORE UPDATE ON public.miembros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();