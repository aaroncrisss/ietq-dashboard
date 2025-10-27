// Normalización de ministerios
const MINISTERIOS_VALIDOS = ['Jóvenes', 'Dorcas', 'Varones', 'Escuela Dominical'];

export function normalizeMinisterios(participaGrupos: string): string[] {
  if (!participaGrupos || participaGrupos.trim() === '') return [];
  
  // Separar por comas
  const partes = participaGrupos.split(',').map(p => p.trim());
  
  const ministerios: string[] = [];
  
  for (const parte of partes) {
    const lower = parte.toLowerCase();
    
    // Normalizar variaciones comunes
    if (lower.includes('joven') || lower.includes('jóven')) {
      if (!ministerios.includes('Jóvenes')) ministerios.push('Jóvenes');
    } else if (lower.includes('dorcas')) {
      if (!ministerios.includes('Dorcas')) ministerios.push('Dorcas');
    } else if (lower.includes('varon') || lower.includes('varón')) {
      if (!ministerios.includes('Varones')) ministerios.push('Varones');
    } else if (lower.includes('escuela') && lower.includes('dominical')) {
      if (!ministerios.includes('Escuela Dominical')) ministerios.push('Escuela Dominical');
    }
    // Ignorar "si", "no" y otros ruidos
  }
  
  return ministerios;
}

export { MINISTERIOS_VALIDOS };
