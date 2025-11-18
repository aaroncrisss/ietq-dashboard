import { format } from "date-fns";
import { es } from "date-fns/locale";

export type DiaCulto = "domingo" | "miércoles" | "viernes";

export interface CultoInfo {
  fechaCulto: string;
  diaCulto: DiaCulto;
  fechaRegistro: string;
}

export const FRECUENCIAS_DECLARADAS = [
  "domingo",
  "miércoles",
  "viernes",
  "domingo/miércoles",
  "domingo/viernes",
  "miércoles/viernes",
  "domingo/miércoles/viernes",
  "todos",
  "ocasional",
];

const SANTIAGO_TZ = "America/Santiago";

export const getSantiagoNow = (baseDate = new Date()) =>
  new Date(baseDate.toLocaleString("en-US", { timeZone: SANTIAGO_TZ }));

export const getCultoInfo = (baseDate = new Date()): CultoInfo => {
  const now = getSantiagoNow(baseDate);
  const today = new Date(now);

  const day = today.getDay(); // 0 Sunday, 1 Monday...
  let target = new Date(today);
  let diaCulto: DiaCulto = "domingo";

  const setDateAndDay = (offset: number, label: DiaCulto) => {
    target.setDate(target.getDate() + offset);
    diaCulto = label;
  };

  switch (day) {
    case 0:
      setDateAndDay(0, "domingo");
      break;
    case 1:
      setDateAndDay(-1, "domingo");
      break;
    case 2:
      setDateAndDay(-2, "domingo");
      break;
    case 3:
      setDateAndDay(0, "miércoles");
      break;
    case 4:
      setDateAndDay(-1, "miércoles");
      break;
    case 5:
      setDateAndDay(0, "viernes");
      break;
    case 6:
      setDateAndDay(-1, "viernes");
      break;
    default:
      setDateAndDay(0, "domingo");
  }

  target.setHours(12, 0, 0, 0); // avoid timezone shift when serializing

  return {
    fechaCulto: target.toISOString().split("T")[0],
    diaCulto,
    fechaRegistro: now.toISOString(),
  };
};

export const formatRelativeDate = (value?: string | null) => {
  if (!value) return "Sin registros";
  try {
    const date = new Date(value);
    return format(date, "PPPP", { locale: es });
  } catch {
    return value;
  }
};

export interface AttendanceCsvRecord {
  rut: string | null;
  nombre: string;
  fecha_registro: string;
  fecha_culto: string;
  dia_semana_culto: string;
  asistio: boolean;
  frecuencia_declarada: string | null;
  tipo_registro: string | null;
}

export const buildAttendanceCsv = (rows: AttendanceCsvRecord[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((header) => {
      const raw = (row as Record<string, unknown>)[header];
      if (raw === null || raw === undefined) return "";
      const value = typeof raw === "string" ? raw.replace(/"/g, '""') : String(raw);
      return value.includes(",") ? `"${value}"` : value;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
};
