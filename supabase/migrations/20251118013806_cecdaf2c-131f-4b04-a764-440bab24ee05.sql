-- Fix security definer issues on views by recreating them with SECURITY INVOKER
DROP VIEW IF EXISTS public.asistencias_por_persona CASCADE;
DROP VIEW IF EXISTS public.asistencias_ultimos_60_dias CASCADE;
DROP VIEW IF EXISTS public.faltas_consecutivas CASCADE;

-- Recreate view for attendance by person with SECURITY INVOKER
CREATE VIEW public.asistencias_por_persona 
WITH (security_invoker = true) AS
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

-- Recreate view for attendance in last 60 days with SECURITY INVOKER
CREATE VIEW public.asistencias_ultimos_60_dias 
WITH (security_invoker = true) AS
SELECT 
  fecha_culto,
  COUNT(*) as total,
  COUNT(CASE WHEN asistio THEN 1 END) as presentes,
  COUNT(CASE WHEN NOT asistio THEN 1 END) as ausentes
FROM public.asistencias
WHERE fecha_culto >= CURRENT_DATE - INTERVAL '60 days'
GROUP BY fecha_culto
ORDER BY fecha_culto DESC;

-- Recreate view for consecutive absences with SECURITY INVOKER
CREATE VIEW public.faltas_consecutivas 
WITH (security_invoker = true) AS
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

-- Fix search_path for the function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;