-- Flight Plans Table
CREATE TABLE flight_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Aircraft Info
  aircraft_type TEXT NOT NULL, -- 'ultramagic-425' or 'cameron-450'
  aircraft_registration TEXT,
  
  -- Flight Details
  flight_date DATE NOT NULL,
  pilot_name TEXT NOT NULL,
  pilot_license TEXT,
  
  -- Weather Data
  temperature_celsius NUMERIC(5,2) NOT NULL,
  qnh_hpa INTEGER,
  wind_surface_speed INTEGER,
  wind_surface_direction INTEGER,
  wind_altitude_1000m_speed INTEGER,
  wind_altitude_1000m_direction INTEGER,
  wind_altitude_2000m_speed INTEGER,
  wind_altitude_2000m_direction INTEGER,
  
  -- Performance Calculations
  calculated_lift_kg NUMERIC(8,2),
  available_payload_kg NUMERIC(8,2),
  
  -- Passenger Manifest
  passengers JSONB, -- Array of {name: string, weight: number}
  total_passenger_weight_kg NUMERIC(8,2),
  clothing_luggage_included BOOLEAN DEFAULT false,
  
  -- Fuel Management
  fuel_total_liters NUMERIC(8,2) NOT NULL,
  fuel_estimated_consumption_liters NUMERIC(8,2) NOT NULL,
  fuel_reserve_minutes INTEGER,
  fuel_reserve_sufficient BOOLEAN,
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'completed'
  
  -- Email tracking
  email_sent_at TIMESTAMP WITH TIME ZONE
);

-- Index for querying by date
CREATE INDEX idx_flight_plans_date ON flight_plans(flight_date DESC);

-- Index for querying by aircraft
CREATE INDEX idx_flight_plans_aircraft ON flight_plans(aircraft_type, aircraft_registration);
