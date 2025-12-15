import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      flight_plans: {
        Row: {
          id: string;
          created_at: string;
          aircraft_type: string;
          aircraft_registration: string | null;
          flight_date: string;
          pilot_name: string;
          pilot_license: string | null;
          temperature_celsius: number;
          qnh_hpa: number | null;
          wind_surface_speed: number | null;
          wind_surface_direction: number | null;
          wind_altitude_1000m_speed: number | null;
          wind_altitude_1000m_direction: number | null;
          wind_altitude_2000m_speed: number | null;
          wind_altitude_2000m_direction: number | null;
          calculated_lift_kg: number | null;
          available_payload_kg: number | null;
          passengers: Array<{ name: string; weight: number }> | null;
          total_passenger_weight_kg: number | null;
          clothing_luggage_included: boolean;
          fuel_total_liters: number;
          fuel_estimated_consumption_liters: number;
          fuel_reserve_minutes: number | null;
          fuel_reserve_sufficient: boolean | null;
          status: string;
          email_sent_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['flight_plans']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['flight_plans']['Insert']>;
      };
    };
  };
};
