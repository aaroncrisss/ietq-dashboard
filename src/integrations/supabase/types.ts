export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      asistencias: {
        Row: {
          id: number
          rut: string | null
          nombre: string
          fecha_registro: string
          fecha_culto: string
          dia_semana_culto: string
          asistio: boolean | null
          frecuencia_declarada: string | null
          tipo_registro: string | null
          ip_registro: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          rut?: string | null
          nombre: string
          fecha_registro: string
          fecha_culto: string
          dia_semana_culto: string
          asistio?: boolean | null
          frecuencia_declarada?: string | null
          tipo_registro?: string | null
          ip_registro?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          rut?: string | null
          nombre?: string
          fecha_registro?: string
          fecha_culto?: string
          dia_semana_culto?: string
          asistio?: boolean | null
          frecuencia_declarada?: string | null
          tipo_registro?: string | null
          ip_registro?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      miembros: {
        Row: {
          id: number
          nombre: string
          rut: string | null
          frecuencia_declarada: string | null
          tipo_registro: string | null
          es_activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          nombre: string
          rut?: string | null
          frecuencia_declarada?: string | null
          tipo_registro?: string | null
          es_activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          rut?: string | null
          frecuencia_declarada?: string | null
          tipo_registro?: string | null
          es_activo?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      asistencias_por_persona: {
        Row: {
          rut: string | null
          nombre: string | null
          tipo_registro: string | null
          total_asistencias: number | null
          ultima_asistencia: string | null
          asistencias_confirmadas: number | null
        }
        Relationships: []
      }
      asistencias_ultimos_60_dias: {
        Row: {
          id: number | null
          rut: string | null
          nombre: string | null
          fecha_registro: string | null
          fecha_culto: string | null
          dia_semana_culto: string | null
          asistio: boolean | null
          frecuencia_declarada: string | null
          tipo_registro: string | null
        }
        Relationships: []
      }
      asistencias_mensuales: {
        Row: {
          mes: string | null
          dia_semana_culto: string | null
          total_asistencias: number | null
        }
        Relationships: []
      }
      faltas_consecutivas: {
        Row: {
          miembro_id: number | null
          nombre: string | null
          rut: string | null
          frecuencia_declarada: string | null
          tipo_registro: string | null
          tipo_alerta: string | null
          detalle: string | null
          ultimas_fechas: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
