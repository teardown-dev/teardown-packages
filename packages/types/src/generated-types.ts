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
      dashboard_user_sessions: {
        Row: {
          created_at: string
          id: string
          last_activity_at: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_at?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_at?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daytona_sandboxes: {
        Row: {
          auto_stop_interval: number
          created_at: string
          daytona_sandbox_id: string
          deleted_at: string | null
          env_vars: Json
          error_reason: string | null
          id: string
          is_recoverable: boolean
          labels: Json
          language: string
          name: string
          project_id: string
          status: Database["public"]["Enums"]["daytona_sandbox_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_stop_interval?: number
          created_at?: string
          daytona_sandbox_id: string
          deleted_at?: string | null
          env_vars?: Json
          error_reason?: string | null
          id?: string
          is_recoverable?: boolean
          labels?: Json
          language?: string
          name: string
          project_id: string
          status?: Database["public"]["Enums"]["daytona_sandbox_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_stop_interval?: number
          created_at?: string
          daytona_sandbox_id?: string
          deleted_at?: string | null
          env_vars?: Json
          error_reason?: string | null
          id?: string
          is_recoverable?: boolean
          labels?: Json
          language?: string
          name?: string
          project_id?: string
          status?: Database["public"]["Enums"]["daytona_sandbox_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daytona_sandboxes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_server_instances: {
        Row: {
          created_at: string
          destroyed_at: string | null
          domain: string | null
          id: string
          name: string
          project_id: string
          railway_deployment_id: string | null
          railway_service_id: string
          session_metadata: Json | null
          status: Database["public"]["Enums"]["dev_server_instance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destroyed_at?: string | null
          domain?: string | null
          id?: string
          name: string
          project_id: string
          railway_deployment_id?: string | null
          railway_service_id: string
          session_metadata?: Json | null
          status?: Database["public"]["Enums"]["dev_server_instance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destroyed_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          project_id?: string
          railway_deployment_id?: string | null
          railway_service_id?: string
          session_metadata?: Json | null
          status?: Database["public"]["Enums"]["dev_server_instance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_server_instances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      device_sessions: {
        Row: {
          build_number: number
          created_at: string
          device_id: string
          emergency_launch_reason: string | null
          environment_id: string | null
          id: string
          is_embedded_launch: boolean | null
          is_emergency_launch: boolean | null
          metadata: Json | null
          os_version: string | null
          ota_update_created_at: string | null
          ota_update_id: string | null
          ota_update_runtime_version: string | null
          ota_updates_enabled: boolean | null
          sdk_name: string | null
          sdk_version: string | null
          started_at: string
          token: string
          token_expires_at: string
          updated_at: string
          version: string
          version_build_id: string
          version_id: string
        }
        Insert: {
          build_number: number
          created_at?: string
          device_id: string
          emergency_launch_reason?: string | null
          environment_id?: string | null
          id?: string
          is_embedded_launch?: boolean | null
          is_emergency_launch?: boolean | null
          metadata?: Json | null
          os_version?: string | null
          ota_update_created_at?: string | null
          ota_update_id?: string | null
          ota_update_runtime_version?: string | null
          ota_updates_enabled?: boolean | null
          sdk_name?: string | null
          sdk_version?: string | null
          started_at?: string
          token: string
          token_expires_at: string
          updated_at?: string
          version: string
          version_build_id: string
          version_id: string
        }
        Update: {
          build_number?: number
          created_at?: string
          device_id?: string
          emergency_launch_reason?: string | null
          environment_id?: string | null
          id?: string
          is_embedded_launch?: boolean | null
          is_emergency_launch?: boolean | null
          metadata?: Json | null
          os_version?: string | null
          ota_update_created_at?: string | null
          ota_update_id?: string | null
          ota_update_runtime_version?: string | null
          ota_updates_enabled?: boolean | null
          sdk_name?: string | null
          sdk_version?: string | null
          started_at?: string
          token?: string
          token_expires_at?: string
          updated_at?: string
          version?: string
          version_build_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "view_device_session_user"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "device_sessions_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sessions_ota_update_id_fkey"
            columns: ["ota_update_id"]
            isOneToOne: false
            referencedRelation: "ota_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sessions_version_build_id_fkey"
            columns: ["version_build_id"]
            isOneToOne: false
            referencedRelation: "version_builds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sessions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_brand: string | null
          device_id: string
          device_name: string | null
          environment_id: string | null
          id: string
          metadata: Json | null
          os_name: string | null
          os_type: string | null
          platform: Database["public"]["Enums"]["device_platform"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_brand?: string | null
          device_id: string
          device_name?: string | null
          environment_id?: string | null
          id?: string
          metadata?: Json | null
          os_name?: string | null
          os_type?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_brand?: string | null
          device_id?: string
          device_name?: string | null
          environment_id?: string | null
          id?: string
          metadata?: Json | null
          os_name?: string | null
          os_type?: string | null
          platform?: Database["public"]["Enums"]["device_platform"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "project_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "view_device_session_user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      environments: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          slug: string
          type: Database["public"]["Enums"]["environment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          slug: string
          type: Database["public"]["Enums"]["environment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          slug?: string
          type?: Database["public"]["Enums"]["environment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "environments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          device_id: string | null
          environment_id: string
          event_name: string
          event_type: string
          id: string
          properties: Json | null
          session_id: string | null
          timestamp: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          environment_id: string
          event_name: string
          event_type?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          timestamp: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          environment_id?: string
          event_name?: string
          event_type?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "view_device_session_user"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "events_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "device_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "view_device_session_user"
            referencedColumns: ["session_id"]
          },
        ]
      }
      github_installations: {
        Row: {
          account_id: number
          account_login: string
          account_type: string
          created_at: string
          events: string[] | null
          id: string
          installation_id: number
          installed_by_user_id: string | null
          permissions: Json | null
          suspended_at: string | null
          suspended_by: Json | null
          target_type: string
          updated_at: string
        }
        Insert: {
          account_id: number
          account_login: string
          account_type: string
          created_at?: string
          events?: string[] | null
          id?: string
          installation_id: number
          installed_by_user_id?: string | null
          permissions?: Json | null
          suspended_at?: string | null
          suspended_by?: Json | null
          target_type: string
          updated_at?: string
        }
        Update: {
          account_id?: number
          account_login?: string
          account_type?: string
          created_at?: string
          events?: string[] | null
          id?: string
          installation_id?: number
          installed_by_user_id?: string | null
          permissions?: Json | null
          suspended_at?: string | null
          suspended_by?: Json | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      github_project_connections: {
        Row: {
          connected_by_user_id: string
          created_at: string
          id: string
          installation_id: string
          project_id: string
          repository_id: string
          updated_at: string
        }
        Insert: {
          connected_by_user_id: string
          created_at?: string
          id?: string
          installation_id: string
          project_id: string
          repository_id: string
          updated_at?: string
        }
        Update: {
          connected_by_user_id?: string
          created_at?: string
          id?: string
          installation_id?: string
          project_id?: string
          repository_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_project_connections_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "github_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_project_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_project_connections_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "github_repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      github_repositories: {
        Row: {
          archived: boolean
          created_at: string
          default_branch: string
          disabled: boolean
          fork: boolean
          full_name: string
          id: string
          installation_id: string
          name: string
          owner: string
          permissions: Json | null
          private: boolean
          repository_id: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          default_branch?: string
          disabled?: boolean
          fork?: boolean
          full_name: string
          id?: string
          installation_id: string
          name: string
          owner: string
          permissions?: Json | null
          private?: boolean
          repository_id: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          default_branch?: string
          disabled?: boolean
          fork?: boolean
          full_name?: string
          id?: string
          installation_id?: string
          name?: string
          owner?: string
          permissions?: Json | null
          private?: boolean
          repository_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repositories_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "github_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      github_webhook_events: {
        Row: {
          action: string | null
          created_at: string
          delivery_id: string | null
          error: string | null
          event_type: string
          id: string
          installation_id: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          delivery_id?: string | null
          error?: string | null
          event_type: string
          id?: string
          installation_id?: string | null
          payload: Json
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          delivery_id?: string | null
          error?: string | null
          event_type?: string
          id?: string
          installation_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "github_webhook_events_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "github_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_access: {
        Row: {
          created_at: string
          granted_at: string | null
          granted_by: string | null
          id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["investor_access_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["investor_access_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["investor_access_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      launchpad_github_repositories: {
        Row: {
          clone_url: string
          created_at: string
          created_by_user_id: string
          default_branch: string
          full_name: string
          html_url: string
          id: string
          name: string
          owner: string
          private: boolean
          project_id: string
          repository_id: number
          ssh_url: string
          updated_at: string
        }
        Insert: {
          clone_url: string
          created_at?: string
          created_by_user_id: string
          default_branch?: string
          full_name: string
          html_url: string
          id?: string
          name: string
          owner: string
          private?: boolean
          project_id: string
          repository_id: number
          ssh_url: string
          updated_at?: string
        }
        Update: {
          clone_url?: string
          created_at?: string
          created_by_user_id?: string
          default_branch?: string
          full_name?: string
          html_url?: string
          id?: string
          name?: string
          owner?: string
          private?: boolean
          project_id?: string
          repository_id?: number
          ssh_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "launchpad_github_repositories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      org_api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["org_role_type"]
          status: Database["public"]["Enums"]["org_invitation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role_type"]
          status?: Database["public"]["Enums"]["org_invitation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role_type"]
          status?: Database["public"]["Enums"]["org_invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          billing_email: string | null
          created_at: string
          id: string
          mau_limit: number
          name: string
          project_limit: number
          seat_limit: number
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_period_end: string | null
          subscription_period_start: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          id?: string
          mau_limit?: number
          name: string
          project_limit?: number
          seat_limit?: number
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          id?: string
          mau_limit?: number
          name?: string
          project_limit?: number
          seat_limit?: number
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      ota_updates: {
        Row: {
          channel: string | null
          created_at: string
          fingerprint: string | null
          id: string
          metadata: Json | null
          update_id: string
          updated_at: string
          version_build_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          metadata?: Json | null
          update_id: string
          updated_at?: string
          version_build_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          metadata?: Json | null
          update_id?: string
          updated_at?: string
          version_build_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ota_updates_version_build_id_fkey"
            columns: ["version_build_id"]
            isOneToOne: false
            referencedRelation: "version_builds"
            referencedColumns: ["id"]
          },
        ]
      }
      project_api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: Database["public"]["Enums"]["project_api_key_kind"]
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key?: string
          kind?: Database["public"]["Enums"]["project_api_key_kind"]
          name?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: Database["public"]["Enums"]["project_api_key_kind"]
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_users: {
        Row: {
          created_at: string
          email: string | null
          environment_id: string
          id: string
          name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          environment_id: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          environment_id?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_users_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          created_at: string
          id: string
          major: number
          minor: number
          name: string
          notes: string | null
          patch: number
          project_id: string
          release_at: string
          status: Database["public"]["Enums"]["project_version_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          major?: number
          minor?: number
          name: string
          notes?: string | null
          patch?: number
          project_id: string
          release_at?: string
          status?: Database["public"]["Enums"]["project_version_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          major?: number
          minor?: number
          name?: string
          notes?: string | null
          patch?: number
          project_id?: string
          release_at?: string
          status?: Database["public"]["Enums"]["project_version_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      railway_project_configs: {
        Row: {
          created_at: string
          id: string
          project_id: string
          railway_environment_id: string
          railway_project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          railway_environment_id: string
          railway_project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          railway_environment_id?: string
          railway_project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "railway_project_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          created_at: string
          id: string
          mau_count: number
          org_id: string
          period_end: string
          period_start: string
          project_count: number
          seat_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mau_count?: number
          org_id: string
          period_end: string
          period_start: string
          project_count?: number
          seat_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mau_count?: number
          org_id?: string
          period_end?: string
          period_start?: string
          project_count?: number
          seat_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      version_builds: {
        Row: {
          build_number: number
          commit_sha: string | null
          created_at: string
          fingerprint: string | null
          id: string
          name: string | null
          notes: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          status: Database["public"]["Enums"]["version_build_status"]
          updated_at: string
          version_id: string
        }
        Insert: {
          build_number: number
          commit_sha?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          platform: Database["public"]["Enums"]["device_platform"]
          status?: Database["public"]["Enums"]["version_build_status"]
          updated_at?: string
          version_id: string
        }
        Update: {
          build_number?: number
          commit_sha?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          platform?: Database["public"]["Enums"]["device_platform"]
          status?: Database["public"]["Enums"]["version_build_status"]
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "version_builds_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_device_session_user: {
        Row: {
          device_brand: string | null
          device_id: string | null
          device_name: string | null
          device_platform: Database["public"]["Enums"]["device_platform"] | null
          environment_id: string | null
          os_version: string | null
          session_id: string | null
          started_at: string | null
          user_email: string | null
          user_external_id: string | null
          user_id: string | null
          user_name: string | null
          version_build_id: string | null
          version_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_sessions_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sessions_version_build_id_fkey"
            columns: ["version_build_id"]
            isOneToOne: false
            referencedRelation: "version_builds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_sessions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "project_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_create_org_api_key: {
        Args: { p_name?: string; p_org_id: string }
        Returns: {
          created_at: string
          id: string
          key: string
          name: string
          org_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "org_api_keys"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_create_user_api_key: {
        Args: { key_name?: string; user_id: string }
        Returns: {
          created_at: string
          id: string
          key: string
          name: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_api_keys"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_ensure_default_environments: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      get_admin_stats: {
        Args: { top_n?: number }
        Returns: Database["public"]["CompositeTypes"]["admin_stats_result"]
        SetofOptions: {
          from: "*"
          to: "admin_stats_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_admin_user_stats: {
        Args: { exclude_user_ids?: string[]; top_n?: number }
        Returns: {
          id: string
          last_active: string
          org_count: number
          session_count: number
        }[]
      }
      resolve_project_id_from_session: {
        Args: { _env_id: string; _version_id: string }
        Returns: string
      }
      search_active_sessions: {
        Args: {
          p_end_date: string
          p_environment_ids: string[]
          p_search?: string
          p_start_date: string
        }
        Returns: {
          build_number: number
          build_platform: string
          device_id: string
          device_platform: string
          session_id: string
          user_id: string
          version_build_id: string
          version_id: string
          version_name: string
        }[]
      }
      search_admin_users: {
        Args: {
          exclude_user_ids?: string[]
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          last_active: string
          org_count: number
          org_names: string[]
          session_count: number
          user_id: string
        }[]
      }
      search_build_sessions: {
        Args: {
          p_build_id: string
          p_end_date: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_start_date: string
        }
        Returns: {
          device_brand: string
          device_id: string
          device_name: string
          os_version: string
          session_id: string
          started_at: string
          user_email: string
          user_external_id: string
          user_id: string
          user_name: string
        }[]
      }
    }
    Enums: {
      daytona_sandbox_status:
        | "CREATING"
        | "STARTED"
        | "STOPPED"
        | "ARCHIVED"
        | "ERROR"
        | "DELETED"
      dev_server_instance_status:
        | "CREATING"
        | "DEPLOYING"
        | "RUNNING"
        | "STOPPING"
        | "STOPPED"
        | "ERROR"
        | "DESTROYED"
      device_platform:
        | "IOS"
        | "ANDROID"
        | "WEB"
        | "WINDOWS"
        | "MACOS"
        | "LINUX"
        | "PHONE"
        | "TABLET"
        | "DESKTOP"
        | "CONSOLE"
        | "TV"
        | "WEARABLE"
        | "GAME_CONSOLE"
        | "VR"
        | "UNKNOWN"
        | "OTHER"
      environment_type: "DEVELOPMENT" | "STAGING" | "PRODUCTION"
      investor_access_status: "PENDING" | "APPROVED" | "REJECTED"
      message_role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL"
      org_invitation_status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED"
      org_role_type: "OWNER" | "ADMIN" | "ENGINEER"
      org_type: "PERSONAL" | "START_UP" | "SCALE_UP" | "AGENCY" | "ENTERPRISE"
      project_api_key_kind: "publishable" | "secret"
      project_status: "ACTIVE" | "PAUSED" | "ARCHIVED"
      project_type: "REACT_NATIVE" | "EXPO"
      project_version_status:
        | "SUPPORTED"
        | "UPDATE_AVAILABLE"
        | "UPDATE_RECOMMENDED"
        | "UPDATE_REQUIRED"
      sandbox_scope: "PROJECT" | "ORG" | "PERSONAL"
      sandbox_status: "CREATING" | "RUNNING" | "PAUSED" | "TERMINATED" | "ERROR"
      subscription_status:
        | "ACTIVE"
        | "PAST_DUE"
        | "CANCELED"
        | "TRIALING"
        | "INCOMPLETE"
        | "INCOMPLETE_EXPIRED"
        | "UNPAID"
      subscription_tier: "FREE" | "STARTER" | "GROWTH" | "SCALE"
      version_build_status:
        | "SUPPORTED"
        | "UPDATE_AVAILABLE"
        | "UPDATE_RECOMMENDED"
        | "UPDATE_REQUIRED"
    }
    CompositeTypes: {
      admin_stats_result: {
        total_orgs: number | null
        total_projects: number | null
        total_users: number | null
        total_sessions: number | null
        top_orgs:
          | Database["public"]["CompositeTypes"]["admin_top_org_stats"][]
          | null
      }
      admin_top_org_stats: {
        id: string | null
        name: string | null
        slug: string | null
        project_count: number | null
        session_count: number | null
        last_active: string | null
      }
      admin_top_user_stats: {
        id: string | null
        session_count: number | null
        org_count: number | null
        last_active: string | null
      }
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
      daytona_sandbox_status: [
        "CREATING",
        "STARTED",
        "STOPPED",
        "ARCHIVED",
        "ERROR",
        "DELETED",
      ],
      dev_server_instance_status: [
        "CREATING",
        "DEPLOYING",
        "RUNNING",
        "STOPPING",
        "STOPPED",
        "ERROR",
        "DESTROYED",
      ],
      device_platform: [
        "IOS",
        "ANDROID",
        "WEB",
        "WINDOWS",
        "MACOS",
        "LINUX",
        "PHONE",
        "TABLET",
        "DESKTOP",
        "CONSOLE",
        "TV",
        "WEARABLE",
        "GAME_CONSOLE",
        "VR",
        "UNKNOWN",
        "OTHER",
      ],
      environment_type: ["DEVELOPMENT", "STAGING", "PRODUCTION"],
      investor_access_status: ["PENDING", "APPROVED", "REJECTED"],
      message_role: ["USER", "ASSISTANT", "SYSTEM", "TOOL"],
      org_invitation_status: ["PENDING", "ACCEPTED", "CANCELLED", "EXPIRED"],
      org_role_type: ["OWNER", "ADMIN", "ENGINEER"],
      org_type: ["PERSONAL", "START_UP", "SCALE_UP", "AGENCY", "ENTERPRISE"],
      project_api_key_kind: ["publishable", "secret"],
      project_status: ["ACTIVE", "PAUSED", "ARCHIVED"],
      project_type: ["REACT_NATIVE", "EXPO"],
      project_version_status: [
        "SUPPORTED",
        "UPDATE_AVAILABLE",
        "UPDATE_RECOMMENDED",
        "UPDATE_REQUIRED",
      ],
      sandbox_scope: ["PROJECT", "ORG", "PERSONAL"],
      sandbox_status: ["CREATING", "RUNNING", "PAUSED", "TERMINATED", "ERROR"],
      subscription_status: [
        "ACTIVE",
        "PAST_DUE",
        "CANCELED",
        "TRIALING",
        "INCOMPLETE",
        "INCOMPLETE_EXPIRED",
        "UNPAID",
      ],
      subscription_tier: ["FREE", "STARTER", "GROWTH", "SCALE"],
      version_build_status: [
        "SUPPORTED",
        "UPDATE_AVAILABLE",
        "UPDATE_RECOMMENDED",
        "UPDATE_REQUIRED",
      ],
    },
  },
} as const
