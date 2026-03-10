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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string
          id?: string
          transaction_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          allowed_inputs: string[] | null
          constraints: string[] | null
          created_at: string
          deterministic_mode: boolean
          expected_outputs: string[] | null
          goal: string | null
          guardrails: string[] | null
          id: string
          max_tokens: number
          memory_enabled: boolean
          model: string | null
          name: string
          output_format: string | null
          provider: string | null
          role: string | null
          slm_mode: boolean
          system_prompt: string | null
          tags: string[] | null
          task_boundaries: string | null
          temperature: number
          tone: string | null
          tool_access_enabled: boolean
          type: Database["public"]["Enums"]["module_type"]
          updated_at: string
          user_id: string
          version_count: number
        }
        Insert: {
          allowed_inputs?: string[] | null
          constraints?: string[] | null
          created_at?: string
          deterministic_mode?: boolean
          expected_outputs?: string[] | null
          goal?: string | null
          guardrails?: string[] | null
          id?: string
          max_tokens?: number
          memory_enabled?: boolean
          model?: string | null
          name: string
          output_format?: string | null
          provider?: string | null
          role?: string | null
          slm_mode?: boolean
          system_prompt?: string | null
          tags?: string[] | null
          task_boundaries?: string | null
          temperature?: number
          tone?: string | null
          tool_access_enabled?: boolean
          type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
          user_id: string
          version_count?: number
        }
        Update: {
          allowed_inputs?: string[] | null
          constraints?: string[] | null
          created_at?: string
          deterministic_mode?: boolean
          expected_outputs?: string[] | null
          goal?: string | null
          guardrails?: string[] | null
          id?: string
          max_tokens?: number
          memory_enabled?: boolean
          model?: string | null
          name?: string
          output_format?: string | null
          provider?: string | null
          role?: string | null
          slm_mode?: boolean
          system_prompt?: string | null
          tags?: string[] | null
          task_boundaries?: string | null
          temperature?: number
          tone?: string | null
          tool_access_enabled?: boolean
          type?: Database["public"]["Enums"]["module_type"]
          updated_at?: string
          user_id?: string
          version_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"]
          tags: string[] | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string
          version_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id: string
          version_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string
          version_count?: number
        }
        Relationships: []
      }
      runs: {
        Row: {
          completed_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
          steps: Json
          target_id: string
          target_name: string
          target_type: string
          total_duration_ms: number
          user_id: string
          version: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          steps?: Json
          target_id: string
          target_name: string
          target_type: string
          total_duration_ms?: number
          user_id: string
          version?: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          steps?: Json
          target_id?: string
          target_name?: string
          target_type?: string
          total_duration_ms?: number
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      stacks: {
        Row: {
          created_at: string
          description: string | null
          edges: Json
          id: string
          name: string
          nodes: Json
          tags: string[] | null
          updated_at: string
          user_id: string
          version_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          name: string
          nodes?: Json
          tags?: string[] | null
          updated_at?: string
          user_id: string
          version_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          version_count?: number
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          label: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          label?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          label?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_balance: number
          credits_used: number
          id: string
          last_reset_at: string
          monthly_allowance: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          credits_used?: number
          id?: string
          last_reset_at?: string
          monthly_allowance?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          credits_used?: number
          id?: string
          last_reset_at?: string
          monthly_allowance?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      module_type:
        | "specialist"
        | "slm"
        | "router"
        | "evaluator"
        | "critic"
        | "comparator"
        | "formatter"
        | "extractor"
        | "classifier"
        | "memory-filter"
        | "human-gate"
        | "synthesizer"
      project_status: "draft" | "building" | "testing" | "deployed" | "archived"
      project_type: "web" | "android" | "module" | "stack" | "hybrid"
      run_status: "pending" | "running" | "success" | "failed" | "paused"
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
      module_type: [
        "specialist",
        "slm",
        "router",
        "evaluator",
        "critic",
        "comparator",
        "formatter",
        "extractor",
        "classifier",
        "memory-filter",
        "human-gate",
        "synthesizer",
      ],
      project_status: ["draft", "building", "testing", "deployed", "archived"],
      project_type: ["web", "android", "module", "stack", "hybrid"],
      run_status: ["pending", "running", "success", "failed", "paused"],
    },
  },
} as const
