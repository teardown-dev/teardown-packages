export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bike: {
        Row: {
          cc: number
          deleted: boolean
          description: string
          engine_configuration: string
          final_drive: string
          fuel_capacity: number
          highlight: string
          id: string
          images: string[]
          luggage_system: string
          name: string
          other_features: string
          power: number
          seat_height: number
          slug: string
          status: Database["public"]["Enums"]["bike_status_enum"]
          torque_nm: number
          torque_revs: number
          weight: number
          wind_protection: string
        }
        Insert: {
          cc: number
          deleted?: boolean
          description: string
          engine_configuration: string
          final_drive: string
          fuel_capacity: number
          highlight?: string
          id?: string
          images: string[]
          luggage_system: string
          name: string
          other_features: string
          power: number
          seat_height: number
          slug: string
          status?: Database["public"]["Enums"]["bike_status_enum"]
          torque_nm: number
          torque_revs: number
          weight: number
          wind_protection: string
        }
        Update: {
          cc?: number
          deleted?: boolean
          description?: string
          engine_configuration?: string
          final_drive?: string
          fuel_capacity?: number
          highlight?: string
          id?: string
          images?: string[]
          luggage_system?: string
          name?: string
          other_features?: string
          power?: number
          seat_height?: number
          slug?: string
          status?: Database["public"]["Enums"]["bike_status_enum"]
          torque_nm?: number
          torque_revs?: number
          weight?: number
          wind_protection?: string
        }
        Relationships: []
      }
      bike_booking: {
        Row: {
          bike_tour_date_price_id: string
          booking_id: string
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone: string
          id: string
          pillion: boolean
          pillion_amount: number | null
          single_room: boolean
          single_room_amount: number | null
        }
        Insert: {
          bike_tour_date_price_id?: string
          booking_id: string
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone: string
          id?: string
          pillion: boolean
          pillion_amount?: number | null
          single_room: boolean
          single_room_amount?: number | null
        }
        Update: {
          bike_tour_date_price_id?: string
          booking_id?: string
          guest_email?: string
          guest_first_name?: string
          guest_last_name?: string
          guest_phone?: string
          id?: string
          pillion?: boolean
          pillion_amount?: number | null
          single_room?: boolean
          single_room_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bike_booking_bike_tour_date_price_id_fkey"
            columns: ["bike_tour_date_price_id"]
            isOneToOne: false
            referencedRelation: "bike_tour_date_price"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bike_booking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["id"]
          },
        ]
      }
      bike_tour_date_price: {
        Row: {
          amount: number
          bike_id: string
          bikes_available: number
          id: string
          tour_date_id: string
        }
        Insert: {
          amount: number
          bike_id: string
          bikes_available: number
          id?: string
          tour_date_id: string
        }
        Update: {
          amount?: number
          bike_id?: string
          bikes_available?: number
          id?: string
          tour_date_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bike_tour_date_price_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bike"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bike_tour_date_price_tour_date_id_fkey"
            columns: ["tour_date_id"]
            isOneToOne: false
            referencedRelation: "tour_date"
            referencedColumns: ["id"]
          },
        ]
      }
      booking: {
        Row: {
          deposit_amount: number
          deposit_paid: boolean
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone: string
          id: string
          total_amount: number
          total_paid: number
          tour_date_id: string
          tour_id: string
        }
        Insert: {
          deposit_amount: number
          deposit_paid: boolean
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone: string
          id?: string
          total_amount: number
          total_paid: number
          tour_date_id?: string
          tour_id?: string
        }
        Update: {
          deposit_amount?: number
          deposit_paid?: boolean
          guest_email?: string
          guest_first_name?: string
          guest_last_name?: string
          guest_phone?: string
          id?: string
          total_amount?: number
          total_paid?: number
          tour_date_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_tour_date_id_fkey"
            columns: ["tour_date_id"]
            isOneToOne: false
            referencedRelation: "tour_date"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          country: string
          date: string
          id: string
          name: string
          rating: number
          text: string
          tour_id: string | null
        }
        Insert: {
          country: string
          date: string
          id?: string
          name: string
          rating: number
          text: string
          tour_id?: string | null
        }
        Update: {
          country?: string
          date?: string
          id?: string
          name?: string
          rating?: number
          text?: string
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["id"]
          },
        ]
      }
      route: {
        Row: {
          breakfast_included: boolean
          description: string
          dinner_included: boolean
          from: string
          geometry: string | null
          highlight: string
          id: string
          images: string[]
          lunch_included: boolean
          name: string
          to: string
          waypoints: string[]
        }
        Insert: {
          breakfast_included: boolean
          description: string
          dinner_included: boolean
          from: string
          geometry?: string | null
          highlight: string
          id?: string
          images: string[]
          lunch_included: boolean
          name: string
          to: string
          waypoints: string[]
        }
        Update: {
          breakfast_included?: boolean
          description?: string
          dinner_included?: boolean
          from?: string
          geometry?: string | null
          highlight?: string
          id?: string
          images?: string[]
          lunch_included?: boolean
          name?: string
          to?: string
          waypoints?: string[]
        }
        Relationships: []
      }
      tour: {
        Row: {
          description: string
          highlight: string
          id: string
          images: string[]
          is_popular: boolean
          name: string
          number_of_days: number
          number_of_days_riding: number
          on_sale: boolean
          price_from: number
          slug: string
          status: Database["public"]["Enums"]["tour_status_enum"]
          type: string[]
        }
        Insert: {
          description: string
          highlight: string
          id?: string
          images: string[]
          is_popular: boolean
          name: string
          number_of_days: number
          number_of_days_riding: number
          on_sale: boolean
          price_from?: number
          slug: string
          status?: Database["public"]["Enums"]["tour_status_enum"]
          type: string[]
        }
        Update: {
          description?: string
          highlight?: string
          id?: string
          images?: string[]
          is_popular?: boolean
          name?: string
          number_of_days?: number
          number_of_days_riding?: number
          on_sale?: boolean
          price_from?: number
          slug?: string
          status?: Database["public"]["Enums"]["tour_status_enum"]
          type?: string[]
        }
        Relationships: []
      }
      tour_date: {
        Row: {
          finish: string
          id: string
          pillion_amount: number
          single_room_amount: number
          start: string
          status: Database["public"]["Enums"]["tour_date_status_enum"]
          tour_id: string
        }
        Insert: {
          finish: string
          id?: string
          pillion_amount: number
          single_room_amount: number
          start: string
          status: Database["public"]["Enums"]["tour_date_status_enum"]
          tour_id: string
        }
        Update: {
          finish?: string
          id?: string
          pillion_amount?: number
          single_room_amount?: number
          start?: string
          status?: Database["public"]["Enums"]["tour_date_status_enum"]
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_date_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_leg: {
        Row: {
          day: number
          description: string
          id: string
          name: string
          route_id: string | null
          tour_id: string
          type: Database["public"]["Enums"]["tour_leg_type"]
        }
        Insert: {
          day: number
          description: string
          id?: string
          name: string
          route_id?: string | null
          tour_id: string
          type: Database["public"]["Enums"]["tour_leg_type"]
        }
        Update: {
          day?: number
          description?: string
          id?: string
          name?: string
          route_id?: string | null
          tour_id?: string
          type?: Database["public"]["Enums"]["tour_leg_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tour_leg_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "route"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_leg_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tour"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role_enum"]
        }
        Insert: {
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role_enum"]
        }
        Relationships: []
      }
      waypoint: {
        Row: {
          description: string | null
          highlight: string
          id: string
          images: string[]
          latitude: number
          longitude: number
          name: string
          type: Database["public"]["Enums"]["waypoint_type_enum"]
        }
        Insert: {
          description?: string | null
          highlight: string
          id?: string
          images: string[]
          latitude: number
          longitude: number
          name: string
          type?: Database["public"]["Enums"]["waypoint_type_enum"]
        }
        Update: {
          description?: string | null
          highlight?: string
          id?: string
          images?: string[]
          latitude?: number
          longitude?: number
          name?: string
          type?: Database["public"]["Enums"]["waypoint_type_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_users_from_auth_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role_enum"]
      }
    }
    Enums: {
      bike_status_enum: "ACTIVE" | "INACTIVE" | "DELETED"
      tour_date_status_enum:
        | "ACTIVE"
        | "INACTIVE"
        | "DELETED"
        | "FULL"
        | "CANCELLED"
        | "LIMITED_SPACES"
      tour_leg_type: "RIDING_DAY" | "REST_DAY"
      tour_status_enum: "ACTIVE" | "INACTIVE" | "DELETED"
      tour_type_enum: "SELF_GUIDED" | "GUIDED"
      user_role_enum: "ADMIN" | "USER"
      waypoint_type_enum: "POINT_OF_INTEREST" | "POINT" | "STOP"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

