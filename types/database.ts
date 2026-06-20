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
      journey_nodes: {
        Row: {
          id: string;
          journey_id: string;
          parent_id: string | null;
          skill_tag: string;
          title: string;
          content_md: string;
          node_type: "lesson" | "choice" | "milestone";
          xp_value: number;
          archived_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["journey_nodes"]["Row"]> & {
          journey_id: string;
          skill_tag: string;
          title: string;
          content_md: string;
        };
        Update: Partial<Database["public"]["Tables"]["journey_nodes"]["Row"]>;
      };
      journey_choices: {
        Row: {
          id: string;
          node_id: string;
          label: string;
          description: string | null;
          target_skill_tag: string;
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
      skill_catalog: {
        Row: {
          slug: string;
          name: string;
          category: string;
          icon: string | null;
        };
        Insert: Database["public"]["Tables"]["skill_catalog"]["Row"];
        Update: Partial<Database["public"]["Tables"]["skill_catalog"]["Row"]>;
      };
    };
  };
};
