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
      announcements: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          priority: string
          title: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          priority?: string
          title: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          priority?: string
          title?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          active: boolean
          created_at: string
          date: string
          description: string
          icon: string
          id: string
          sort_order: number
          tag: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          date: string
          description: string
          icon?: string
          id?: string
          sort_order?: number
          tag?: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          date?: string
          description?: string
          icon?: string
          id?: string
          sort_order?: number
          tag?: string
          title?: string
        }
        Relationships: []
      }
      cognitive_fingerprints: {
        Row: {
          created_at: string
          dataset_id: string
          domain_bridges: string[]
          fingerprint: Json
          heuristics: string[]
          id: string
          reasoning_style: string
          sample_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          domain_bridges?: string[]
          fingerprint?: Json
          heuristics?: string[]
          id?: string
          reasoning_style?: string
          sample_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          domain_bridges?: string[]
          fingerprint?: Json
          heuristics?: string[]
          id?: string
          reasoning_style?: string
          sample_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_fingerprints_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
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
      dataset_samples: {
        Row: {
          builder: string | null
          created_at: string
          dataset_id: string
          empath: string | null
          frame_breaker: string | null
          id: string
          input: string
          output: string
          quality_score: number
          red_team: string | null
          source_url: string | null
          status: string
          synthesis: string | null
          systems: string | null
          user_id: string
        }
        Insert: {
          builder?: string | null
          created_at?: string
          dataset_id: string
          empath?: string | null
          frame_breaker?: string | null
          id?: string
          input: string
          output: string
          quality_score?: number
          red_team?: string | null
          source_url?: string | null
          status?: string
          synthesis?: string | null
          systems?: string | null
          user_id: string
        }
        Update: {
          builder?: string | null
          created_at?: string
          dataset_id?: string
          empath?: string | null
          frame_breaker?: string | null
          id?: string
          input?: string
          output?: string
          quality_score?: number
          red_team?: string | null
          source_url?: string | null
          status?: string
          synthesis?: string | null
          systems?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_samples_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      deploy_pipeline_status: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          dataset_id: string
          id: string
          metadata: Json
          step_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          dataset_id: string
          id?: string
          metadata?: Json
          step_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          dataset_id?: string
          id?: string
          metadata?: Json
          step_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discussions: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          target_id: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          target_id: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      forge_doodles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          perspectives: string[]
          prompt_seed: string | null
          theme: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          perspectives?: string[]
          prompt_seed?: string | null
          theme?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          perspectives?: string[]
          prompt_seed?: string | null
          theme?: string
        }
        Relationships: []
      }
      founder_interviews: {
        Row: {
          created_at: string
          dataset_id: string
          id: string
          pairs_extracted: number
          status: string
          transcript: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          id?: string
          pairs_extracted?: number
          status?: string
          transcript?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          id?: string
          pairs_extracted?: number
          status?: string
          transcript?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_interviews_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      location_hero_images: {
        Row: {
          country: string
          created_at: string
          id: string
          image_url: string
          ip_hash: string
          region: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          image_url: string
          ip_hash: string
          region?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          image_url?: string
          ip_hash?: string
          region?: string
        }
        Relationships: []
      }
      marketplace_templates: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          downloads: number
          id: string
          name: string
          price_credits: number
          source_id: string | null
          status: string
          tags: string[] | null
          template_data: Json
          tier: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          downloads?: number
          id?: string
          name: string
          price_credits?: number
          source_id?: string | null
          status?: string
          tags?: string[] | null
          template_data?: Json
          tier?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          downloads?: number
          id?: string
          name?: string
          price_credits?: number
          source_id?: string | null
          status?: string
          tags?: string[] | null
          template_data?: Json
          tier?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      mobile_captures: {
        Row: {
          content: string
          created_at: string
          dataset_id: string | null
          file_path: string | null
          id: string
          metadata: Json
          processed_at: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          dataset_id?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json
          processed_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dataset_id?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json
          processed_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_captures_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
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
      page_views: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          page_path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      perspective_jobs: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_at: string
          dataset_id: string
          domain_hint: string | null
          error_message: string | null
          id: string
          input_content: string
          perspective: string
          result: string | null
          source_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string
          dataset_id: string
          domain_hint?: string | null
          error_message?: string | null
          id?: string
          input_content: string
          perspective: string
          result?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string
          dataset_id?: string
          domain_hint?: string | null
          error_message?: string | null
          id?: string
          input_content?: string
          perspective?: string
          result?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perspective_jobs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          referral_code: string
          saved_hero_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          referral_code?: string
          saved_hero_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          referral_code?: string
          saved_hero_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
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
      referral_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          source_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          source_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          source_type?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          revenue_share_pct: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          revenue_share_pct?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          revenue_share_pct?: number
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      template_purchases: {
        Row: {
          buyer_id: string
          created_at: string
          credits_paid: number
          id: string
          template_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          credits_paid: number
          id?: string
          template_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          credits_paid?: number
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_purchases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketplace_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_purchases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketplace_templates_public"
            referencedColumns: ["id"]
          },
        ]
      }
      training_datasets: {
        Row: {
          created_at: string
          description: string
          domain: string
          format: string
          id: string
          name: string
          sample_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          domain?: string
          format?: string
          id?: string
          name: string
          sample_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          domain?: string
          format?: string
          id?: string
          name?: string
          sample_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_jobs: {
        Row: {
          base_model: string
          created_at: string
          dataset_id: string
          hyperparameters: Json
          id: string
          method: string
          metrics: Json
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_model?: string
          created_at?: string
          dataset_id: string
          hyperparameters?: Json
          id?: string
          method?: string
          metrics?: Json
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_model?: string
          created_at?: string
          dataset_id?: string
          hyperparameters?: Json
          id?: string
          method?: string
          metrics?: Json
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_jobs_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
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
      location_hero_images_public: {
        Row: {
          country: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          region: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          region?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          region?: string | null
        }
        Relationships: []
      }
      marketplace_templates_public: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          downloads: number | null
          id: string | null
          name: string | null
          price_credits: number | null
          source_id: string | null
          status: string | null
          tags: string[] | null
          tier: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          downloads?: number | null
          id?: string | null
          name?: string | null
          price_credits?: number | null
          source_id?: string | null
          status?: string | null
          tags?: string[] | null
          tier?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          downloads?: number | null
          id?: string | null
          name?: string | null
          price_credits?: number | null
          source_id?: string | null
          status?: string | null
          tags?: string[] | null
          tier?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
