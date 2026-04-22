export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      caderno_encargos: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          preco_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      diario_obra: {
        Row: {
          atividade: string
          autor: string
          clima: string
          created_at: string
          data_lancamento: string
          descricao: string
          equipe_tamanho: number
          id: string
          material_dn: number | null
          material_tipo: string
          metragem_executada: number
          obra_id: string
          ocorrencias: string | null
          profundidade_media: number
          updated_at: string
        }
        Insert: {
          atividade?: string
          autor?: string
          clima?: string
          created_at?: string
          data_lancamento?: string
          descricao?: string
          equipe_tamanho?: number
          id?: string
          material_dn?: number | null
          material_tipo?: string
          metragem_executada?: number
          obra_id: string
          ocorrencias?: string | null
          profundidade_media?: number
          updated_at?: string
        }
        Update: {
          atividade?: string
          autor?: string
          clima?: string
          created_at?: string
          data_lancamento?: string
          descricao?: string
          equipe_tamanho?: number
          id?: string
          material_dn?: number | null
          material_tipo?: string
          metragem_executada?: number
          obra_id?: string
          ocorrencias?: string | null
          profundidade_media?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      execucao_servicos: {
        Row: {
          created_at: string
          data_execucao: string
          id: string
          item_encargo_id: string
          mes_referencia: string
          obra_id: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_execucao?: string
          id?: string
          item_encargo_id: string
          mes_referencia: string
          obra_id: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_execucao?: string
          id?: string
          item_encargo_id?: string
          mes_referencia?: string
          obra_id?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucao_servicos_item_encargo_id_fkey"
            columns: ["item_encargo_id"]
            isOneToOne: false
            referencedRelation: "caderno_encargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucao_servicos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      gestao_consolidada: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          umb: number
          umf: number
          uml: number
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          umb?: number
          umf?: number
          uml?: number
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          umb?: number
          umf?: number
          uml?: number
          updated_at?: string
        }
        Relationships: []
      }
      materiais: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          dn: number | null
          id: string
          quantidade_estoque: number
          quantidade_necessaria: number
          tipo: string
          unidade: string
          updated_at: string
          ur: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          dn?: number | null
          id?: string
          quantidade_estoque?: number
          quantidade_necessaria?: number
          tipo: string
          unidade?: string
          updated_at?: string
          ur: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          dn?: number | null
          id?: string
          quantidade_estoque?: number
          quantidade_necessaria?: number
          tipo?: string
          unidade?: string
          updated_at?: string
          ur?: string
        }
        Relationships: []
      }
      medicoes_mensais: {
        Row: {
          created_at: string
          id: string
          mes_referencia: string
          status: string
          updated_at: string
          ur: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          mes_referencia: string
          status?: string
          updated_at?: string
          ur: string
          valor_total?: number
        }
        Update: {
          created_at?: string
          id?: string
          mes_referencia?: string
          status?: string
          updated_at?: string
          ur?: string
          valor_total?: number
        }
        Relationships: []
      }
      obra_historico: {
        Row: {
          autor: string
          campo_alterado: string
          created_at: string
          id: string
          obra_id: string
          tipo_evento: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          autor?: string
          campo_alterado: string
          created_at?: string
          id?: string
          obra_id: string
          tipo_evento?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          autor?: string
          campo_alterado?: string
          created_at?: string
          id?: string
          obra_id?: string
          tipo_evento?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_historico_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          alvara_liberado: boolean | null
          alvara_necessario: boolean
          bairro: string
          created_at: string
          data_inicio: string | null
          data_termino: string | null
          dn: number | null
          extensao: number
          finalidade: string
          id: string
          logradouro: string
          material: string
          observacoes: string | null
          prioridade: number
          status: string
          updated_at: string
          ur: string
        }
        Insert: {
          alvara_liberado?: boolean | null
          alvara_necessario?: boolean
          bairro: string
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          dn?: number | null
          extensao?: number
          finalidade?: string
          id?: string
          logradouro: string
          material: string
          observacoes?: string | null
          prioridade?: number
          status?: string
          updated_at?: string
          ur: string
        }
        Update: {
          alvara_liberado?: boolean | null
          alvara_necessario?: boolean
          bairro?: string
          created_at?: string
          data_inicio?: string | null
          data_termino?: string | null
          dn?: number | null
          extensao?: number
          finalidade?: string
          id?: string
          logradouro?: string
          material?: string
          observacoes?: string | null
          prioridade?: number
          status?: string
          updated_at?: string
          ur?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          ur: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
          updated_at?: string
          ur?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          ur?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_ur: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
