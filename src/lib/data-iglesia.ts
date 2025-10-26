export interface MiembroIglesia {
  nombre: string;
  telefono: string;
  rut: string;
  fechaNacimiento: string;
  mes: string;
  edad: number;
  direccion: string;
  tieneWhatsapp: string;
  comunaResidencia: string;
  tieneTransporte: string;
  genero: string;
  tiempoAsistiendo: string;
  diasAsistencia: string;
  asistenSoloOAcompanado: string;
  participaGrupos: string;
  accesoComputador: string;
}

export interface DashboardMetrics {
  totalMiembros: number;
  distribucionGenero: { masculino: number; femenino: number };
  distribucionEdad: { rango: string; cantidad: number }[];
  participantesGrupos: number;
  asistenciaRegular: { tipo: string; cantidad: number }[];
  tasaAccesoTecnologia: number;
  distribucionComuna: { comuna: string; cantidad: number }[];
  tiempoAsistencia: { tiempo: string; cantidad: number }[];
  miembrosConTransporte: number;
  miembrosActivos: number;
  miembrosNuevos: number;
  cumpleanosSemana: { nombre: string; fechaNacimiento: string; edad: number; dia: string }[];
}

const CSV_URL = "https://docs.google.com/spreadsheets/d/1fdUtE6p0TppmMAQi4Uv206ba8IxXIx8C/export?format=csv";

export async function fetchMiembrosData(): Promise<MiembroIglesia[]> {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error("Error al cargar datos");
    
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return [];
    
    const miembros: MiembroIglesia[] = [];
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length >= 16 && values[0]?.trim()) {
        miembros.push({
          nombre: values[0] || '',
          telefono: values[1] || '',
          rut: values[2] || '',
          fechaNacimiento: values[3] || '',
          mes: values[4] || '',
          edad: parseInt(values[5]) || 0,
          direccion: values[6] || '',
          tieneWhatsapp: values[7] || '',
          comunaResidencia: values[8] || '',
          tieneTransporte: values[9] || '',
          genero: values[10] || '',
          tiempoAsistiendo: values[11] || '',
          diasAsistencia: values[12] || '',
          asistenSoloOAcompanado: values[13] || '',
          participaGrupos: values[14] || '',
          accesoComputador: values[15] || '',
        });
      }
    }
    
    return miembros;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function calculateMetrics(miembros: MiembroIglesia[]): DashboardMetrics {
  const totalMiembros = miembros.length;
  
  // Distribución género
  const masculino = miembros.filter(m => m.genero.toLowerCase().includes('masculino')).length;
  const femenino = miembros.filter(m => m.genero.toLowerCase().includes('femenino')).length;
  
  // Distribución edad
  const edadRangos = [
    { rango: '0-10', min: 0, max: 10 },
    { rango: '11-20', min: 11, max: 20 },
    { rango: '21-30', min: 21, max: 30 },
    { rango: '31-40', min: 31, max: 40 },
    { rango: '41-50', min: 41, max: 50 },
    { rango: '51-60', min: 51, max: 60 },
    { rango: '61+', min: 61, max: 999 },
  ];
  
  const distribucionEdad = edadRangos.map(({ rango, min, max }) => ({
    rango,
    cantidad: miembros.filter(m => m.edad >= min && m.edad <= max).length
  }));
  
  // Participantes en grupos
  const participantesGrupos = miembros.filter(m => 
    m.participaGrupos.toLowerCase().includes('si')
  ).length;
  
  // Asistencia regular
  const asistenciaMap = new Map<string, number>();
  miembros.forEach(m => {
    const tipo = m.diasAsistencia || 'No especificado';
    asistenciaMap.set(tipo, (asistenciaMap.get(tipo) || 0) + 1);
  });
  
  const asistenciaRegular = Array.from(asistenciaMap.entries()).map(([tipo, cantidad]) => ({
    tipo,
    cantidad
  }));
  
  // Tasa acceso tecnología
  const conAcceso = miembros.filter(m => 
    m.accesoComputador.toLowerCase().includes('si')
  ).length;
  const tasaAccesoTecnologia = totalMiembros > 0 ? (conAcceso / totalMiembros) * 100 : 0;
  
  // Distribución comuna
  const comunaMap = new Map<string, number>();
  miembros.forEach(m => {
    const comuna = m.comunaResidencia || 'No especificado';
    comunaMap.set(comuna, (comunaMap.get(comuna) || 0) + 1);
  });
  
  const distribucionComuna = Array.from(comunaMap.entries())
    .map(([comuna, cantidad]) => ({ comuna, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
  
  // Tiempo asistencia
  const tiempoMap = new Map<string, number>();
  miembros.forEach(m => {
    const tiempo = m.tiempoAsistiendo || 'No especificado';
    tiempoMap.set(tiempo, (tiempoMap.get(tiempo) || 0) + 1);
  });
  
  const tiempoAsistencia = Array.from(tiempoMap.entries()).map(([tiempo, cantidad]) => ({
    tiempo,
    cantidad
  }));
  
  // Miembros con transporte
  const miembrosConTransporte = miembros.filter(m => 
    m.tieneTransporte.toLowerCase().includes('si')
  ).length;
  
  // Miembros activos (asisten todos los días o viernes y domingo)
  const miembrosActivos = miembros.filter(m => 
    m.diasAsistencia.toLowerCase().includes('todos') || 
    m.diasAsistencia.toLowerCase().includes('viernes y domingo')
  ).length;
  
  // Miembros nuevos (menos de 6 meses asistiendo)
  const miembrosNuevos = miembros.filter(m => 
    m.tiempoAsistiendo.toLowerCase().includes('mes') ||
    m.tiempoAsistiendo.toLowerCase().includes('2-5') ||
    m.tiempoAsistiendo.toLowerCase().includes('1-3')
  ).length;
  
  // Cumpleaños de la semana
  const hoy = new Date();
  const dentroDe7Dias = new Date();
  dentroDe7Dias.setDate(hoy.getDate() + 7);
  
  const cumpleanosSemana = miembros
    .filter(m => m.fechaNacimiento && m.fechaNacimiento.trim())
    .map(m => {
      const fechaParts = m.fechaNacimiento.split('/');
      if (fechaParts.length !== 3) return null;
      
      const dia = parseInt(fechaParts[0]);
      const mes = parseInt(fechaParts[1]);
      
      if (isNaN(dia) || isNaN(mes)) return null;
      
      // Crear fecha de cumpleaños este año
      const cumpleañosEsteAño = new Date(hoy.getFullYear(), mes - 1, dia);
      
      // Si ya pasó este año, usar el próximo año
      if (cumpleañosEsteAño < hoy) {
        cumpleañosEsteAño.setFullYear(hoy.getFullYear() + 1);
      }
      
      // Verificar si está dentro de los próximos 7 días
      if (cumpleañosEsteAño >= hoy && cumpleañosEsteAño <= dentroDe7Dias) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return {
          nombre: m.nombre,
          fechaNacimiento: m.fechaNacimiento,
          edad: m.edad,
          dia: dias[cumpleañosEsteAño.getDay()]
        };
      }
      
      return null;
    })
    .filter(c => c !== null) as { nombre: string; fechaNacimiento: string; edad: number; dia: string }[];
  
  return {
    totalMiembros,
    distribucionGenero: { masculino, femenino },
    distribucionEdad,
    participantesGrupos,
    asistenciaRegular,
    tasaAccesoTecnologia,
    distribucionComuna,
    tiempoAsistencia,
    miembrosConTransporte,
    miembrosActivos,
    miembrosNuevos,
    cumpleanosSemana,
  };
}
