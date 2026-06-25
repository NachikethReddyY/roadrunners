export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          xp: number;
          level: number;
          streak_days: number;
          last_activity_at: string | null;
          onboarding_complete: boolean;
          goal: string | null;
          interests: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };

      skill_catalog: {
        Row: {
          slug: string;
          name: string;
          category: "web" | "mobile" | "data" | "ai" | "devops" | "explore";
          icon: string | null;
        };
        Insert: Database["public"]["Tables"]["skill_catalog"]["Row"];
        Update: Partial<Database["public"]["Tables"]["skill_catalog"]["Row"]>;
      };

      journeys: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          goal: string;
          status: "active" | "completed" | "archived";
          current_node_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["journeys"]["Row"]> & {
          user_id: string;
          title: string;
          goal: string;
        };
        Update: Partial<Database["public"]["Tables"]["journeys"]["Row"]>;
      };

      // Migration 002 adds: is_fallback
      // Migration 003 adds: playground_config
      // Migration 005 adds: checkpoint_mode, controlled_concepts, prerequisite_node_ids, feature_outcome, verification_entrypoint
      journey_nodes: {
        Row: {
          id: string;
          journey_id: string;
          parent_id: string | null;
          skill_tag: string;
          title: string;
          content_md: string;
          node_type: "lesson" | "choice" | "milestone" | "interactive";
          xp_value: number;
          archived_at: string | null;
          created_at: string;
          // migration 002
          is_fallback: boolean;
          // migration 003
          playground_config: Json | null;
          // migration 005
          checkpoint_mode: "guide" | "scrim" | "build" | "choice" | "milestone" | null;
          controlled_concepts: string[];
          prerequisite_node_ids: string[];
          feature_outcome: string | null;
          verification_entrypoint: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["journey_nodes"]["Row"]> & {
          journey_id: string;
          skill_tag: string;
          title: string;
          content_md: string;
        };
        Update: Partial<Database["public"]["Tables"]["journey_nodes"]["Row"]>;
      };

      // Migration 005 adds: concepts, prerequisites, estimated_minutes, suggested_mode,
      //   project_contribution, is_pivot, availability, offer_batch_id
      journey_choices: {
        Row: {
          id: string;
          node_id: string;
          label: string;
          description: string | null;
          target_skill_tag: string;
          // migration 005
          concepts: string[];
          prerequisites: string[];
          estimated_minutes: number | null;
          suggested_mode: "guide" | "scrim" | "build" | null;
          project_contribution: string;
          is_pivot: boolean;
          availability: "unlocked" | "deferred" | "locked";
          offer_batch_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["journey_choices"]["Row"]> & {
          node_id: string;
          label: string;
          target_skill_tag: string;
        };
        Update: Partial<Database["public"]["Tables"]["journey_choices"]["Row"]>;
      };

      decisions: {
        Row: {
          id: string;
          journey_id: string;
          node_id: string;
          choice_id: string | null;
          decided_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["decisions"]["Row"]> & {
          journey_id: string;
          node_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["decisions"]["Row"]>;
      };

      // Migration 003
      lesson_scrims: {
        Row: {
          id: string;
          slug: string;
          title: string;
          skill_tag: string;
          template: "vanilla" | "react-ts" | "python";
          initial_files: Json;
          timeline: Json;
          slides: Json;
          duration_ms: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lesson_scrims"]["Row"]> & {
          slug: string;
          title: string;
          skill_tag: string;
          template: "vanilla" | "react-ts" | "python";
        };
        Update: Partial<Database["public"]["Tables"]["lesson_scrims"]["Row"]>;
      };

      // Migration 003
      user_workspace_snapshots: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          node_id: string | null;
          scrim_id: string | null;
          files: Json;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_workspace_snapshots"]["Row"]> & {
          user_id: string;
          files: Json;
        };
        Update: Partial<Database["public"]["Tables"]["user_workspace_snapshots"]["Row"]>;
      };

      // Migration 004
      user_scrims: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string;
          source_node_id: string | null;
          source_lesson_scrim_id: string | null;
          title: string;
          skill_tag: string | null;
          template: "vanilla" | "react-ts" | "python";
          initial_files: Json;
          timeline: Json;
          slides: Json;
          duration_ms: number;
          resume_timeline_ms: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_scrims"]["Row"]> & {
          user_id: string;
          journey_id: string;
          title: string;
          template: "vanilla" | "react-ts" | "python";
        };
        Update: Partial<Database["public"]["Tables"]["user_scrims"]["Row"]>;
      };

      // Migration 004
      scrim_checkpoints: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string;
          node_id: string | null;
          lesson_scrim_id: string | null;
          user_scrim_id: string | null;
          timeline_ms: number;
          files: Json;
          active_file: string | null;
          label: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["scrim_checkpoints"]["Row"]> & {
          user_id: string;
          journey_id: string;
          timeline_ms: number;
          files: Json;
        };
        Update: Partial<Database["public"]["Tables"]["scrim_checkpoints"]["Row"]>;
      };

      // Migration 004 — service-role only; no client policies
      tts_cache: {
        Row: {
          cache_key: string;
          storage_path: string;
          voice_id: string;
          text_hash: string;
          created_at: string;
        };
        Insert: Database["public"]["Tables"]["tts_cache"]["Row"];
        Update: Partial<Database["public"]["Tables"]["tts_cache"]["Row"]>;
      };

      // Migration 004
      sandbox_sessions: {
        Row: {
          id: string;
          user_id: string;
          journey_id: string | null;
          node_id: string | null;
          scrim_id: string | null;
          daytona_sandbox_id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sandbox_sessions"]["Row"]> & {
          user_id: string;
          daytona_sandbox_id: string;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["sandbox_sessions"]["Row"]>;
      };

      // Migration 005
      choice_offer_batches: {
        Row: {
          id: string;
          journey_id: string;
          node_id: string;
          offer_fingerprint: string;
          offered_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["choice_offer_batches"]["Row"]> & {
          journey_id: string;
          node_id: string;
          offer_fingerprint: string;
        };
        Update: Partial<Database["public"]["Tables"]["choice_offer_batches"]["Row"]>;
      };

      // Migration 005
      verification_evidence: {
        Row: {
          id: string;
          journey_id: string;
          node_id: string;
          user_id: string;
          runs: boolean;
          exit_code: number | null;
          timed_out: boolean;
          stdout_summary: string | null;
          stderr_summary: string | null;
          objective_fulfillment: "pass" | "fail" | "inconclusive";
          fulfills: boolean;
          infrastructure_error: boolean;
          verification_reason: string;
          entrypoint: string | null;
          ai_plausible: boolean | null;
          ai_reason: string | null;
          recorded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["verification_evidence"]["Row"]> & {
          journey_id: string;
          node_id: string;
          user_id: string;
          runs: boolean;
          objective_fulfillment: "pass" | "fail" | "inconclusive";
        };
        Update: Partial<Database["public"]["Tables"]["verification_evidence"]["Row"]>;
      };

      // Migration 005
      checkpoint_completions: {
        Row: {
          id: string;
          journey_id: string;
          node_id: string;
          user_id: string;
          completion_basis: "objective" | "user_confirmed" | "acknowledgment";
          verification_evidence_id: string | null;
          completed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["checkpoint_completions"]["Row"]> & {
          journey_id: string;
          node_id: string;
          user_id: string;
          completion_basis: "objective" | "user_confirmed" | "acknowledgment";
        };
        Update: Partial<Database["public"]["Tables"]["checkpoint_completions"]["Row"]>;
      };

      // Migration 005
      concept_coverage: {
        Row: {
          id: string;
          journey_id: string;
          user_id: string;
          concept_tag: string;
          coverage_state: "introduced" | "practiced" | "verified";
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["concept_coverage"]["Row"]> & {
          journey_id: string;
          user_id: string;
          concept_tag: string;
          coverage_state: "introduced" | "practiced" | "verified";
        };
        Update: Partial<Database["public"]["Tables"]["concept_coverage"]["Row"]>;
      };
    };

    Functions: {
      persist_generated_node: {
        Args: {
          p_journey_id: string;
          p_parent_id: string | null;
          p_node: Json;
          p_is_fallback?: boolean;
        };
        Returns: string;
      };
      complete_checkpoint: {
        Args: {
          p_journey_id: string;
          p_node_id: string;
          p_basis: "objective" | "user_confirmed" | "acknowledgment";
          p_verification_evidence_id?: string | null;
        };
        Returns: string | null;
      };
      upsert_concept_coverage: {
        Args: {
          p_journey_id: string;
          p_concept_tag: string;
          p_state: "introduced" | "practiced" | "verified";
        };
        Returns: void;
      };
    };

    Enums: Record<string, never>;
  };
};
