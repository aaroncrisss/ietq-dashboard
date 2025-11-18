-- Vistas de apoyo para n8n y monitoreo avanzado de asistencia

create or replace view public.asistencias_por_persona as
select
  coalesce(a.rut, concat('SIN-RUT-', a.nombre)) as rut,
  a.nombre,
  max(a.tipo_registro) as tipo_registro,
  count(*) as total_asistencias,
  max(a.fecha_culto) as ultima_asistencia,
  count(*) filter (where asistio) as asistencias_confirmadas
from public.asistencias a
where a.asistio is distinct from false
group by coalesce(a.rut, concat('SIN-RUT-', a.nombre)), a.nombre;

create or replace view public.asistencias_ultimos_60_dias as
select *
from public.asistencias
where fecha_culto::date >= (current_date - interval '60 days');

create or replace view public.asistencias_mensuales as
select
  to_char(date_trunc('month', fecha_culto::date), 'YYYY-MM') as mes,
  dia_semana_culto,
  count(*) filter (where asistio) as total_asistencias
from public.asistencias
where asistio is distinct from false
group by 1, 2
order by mes desc;

-- Vista para detectar faltas consecutivas y personalizadas
create or replace view public.faltas_consecutivas as
with calendario as (
  select generate_series(current_date - interval '90 days', current_date, interval '1 day')::date as dia
),

cultos as (
  select dia as fecha_culto,
    case extract(dow from dia)
      when 0 then 'domingo'
      when 3 then 'miércoles'
      when 5 then 'viernes'
    end as dia_semana_culto
  from calendario
  where extract(dow from dia) in (0, 3, 5)
),

miembros_activos as (
  select * from public.miembros where coalesce(es_activo, true)
),

expectativas as (
  select m.id, m.nombre, coalesce(m.rut, concat('VISITA-', m.id)) as rut,
    m.frecuencia_declarada, m.tipo_registro,
    c.fecha_culto, c.dia_semana_culto
  from miembros_activos m
  join cultos c on true
  where c.fecha_culto >= current_date - interval '60 days'
    and (
      m.frecuencia_declarada ilike '%todos%'
      or (c.dia_semana_culto = 'domingo' and m.frecuencia_declarada ilike '%domingo%')
      or (c.dia_semana_culto = 'miércoles' and m.frecuencia_declarada ilike '%miércoles%')
      or (c.dia_semana_culto = 'viernes' and m.frecuencia_declarada ilike '%viernes%')
      or (m.frecuencia_declarada ilike '%ocasional%' and c.fecha_culto >= date_trunc('month', current_date))
    )
),

chequeos as (
  select e.*, a.id as asistencia_id
  from expectativas e
  left join public.asistencias a
    on a.rut = e.rut
   and a.fecha_culto::date = e.fecha_culto
),

faltas as (
  select *,
    case when asistencia_id is null then 1 else 0 end as falta
  from chequeos
),

marcadores as (
  select *,
    lag(falta) over(partition by id, dia_semana_culto order by fecha_culto) as falta_previa,
    lag(fecha_culto) over(partition by id order by fecha_culto) as fecha_previa_total,
    lag(falta) over(partition by id order by fecha_culto) as falta_prev_total
  from faltas
),

alertas_consecutivas as (
  select *,
    case
      when frecuencia_declarada ilike '%ocasional%' then null
      when frecuencia_declarada ilike '%miércoles%' and frecuencia_declarada ilike '%viernes%'
        then (case when falta = 1 and falta_prev_total = 1 then 1 else 0 end)
      else (case when falta = 1 and falta_previa = 1 then 1 else 0 end)
    end as marca_alerta
  from marcadores
),

alertas_ocasionales as (
  select id, nombre, rut, frecuencia_declarada, tipo_registro,
    date_trunc('month', fecha_culto) as mes, sum(falta) as faltas_mes
  from faltas
  where frecuencia_declarada ilike '%ocasional%'
  group by 1,2,3,4,5,6
  having sum(falta) >= 2
)

select
  ac.id as miembro_id,
  ac.nombre,
  ac.rut,
  ac.frecuencia_declarada,
  ac.tipo_registro,
  case
    when ac.frecuencia_declarada ilike '%ocasional%' then '2 faltas en el mes'
    when ac.frecuencia_declarada ilike '%miércoles%' and ac.frecuencia_declarada ilike '%viernes%' then '2 faltas miércoles-viernes'
    else '2 faltas consecutivas'
  end as tipo_alerta,
  case
    when ac.frecuencia_declarada ilike '%ocasional%' then concat('Mes ', to_char(ao.mes, 'YYYY-MM'), ' con ', ao.faltas_mes, ' faltas')
    when ac.frecuencia_declarada ilike '%miércoles%' and ac.frecuencia_declarada ilike '%viernes%'
      then concat('Sin asistencia en dos cultos seguidos (', to_char(ac.fecha_previa_total, 'YYYY-MM-DD'), ' y ', to_char(ac.fecha_culto, 'YYYY-MM-DD'), ')')
    else concat('Sin asistencia en ', to_char(ac.fecha_previa_total, 'YYYY-MM-DD'), ' y ', to_char(ac.fecha_culto, 'YYYY-MM-DD'))
  end as detalle,
  case
    when ac.frecuencia_declarada ilike '%ocasional%' then to_char(ao.mes, 'YYYY-MM')
    else concat(to_char(ac.fecha_previa_total, 'YYYY-MM-DD'), ',', to_char(ac.fecha_culto, 'YYYY-MM-DD'))
  end as ultimas_fechas
from alertas_consecutivas ac
left join alertas_ocasionales ao on ao.id = ac.id
where (ac.frecuencia_declarada ilike '%ocasional%' and ao.id is not null)
   or (ac.frecuencia_declarada not ilike '%ocasional%' and ac.marca_alerta = 1);
