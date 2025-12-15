import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendFlightPlanEmail } from '@/lib/email';
import { flightPlanSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
    try {
        // Check if Supabase is configured
        if (!supabase) {
            return NextResponse.json(
                { error: 'Database not configured. Please set SUPABASE environment variables.' },
                { status: 503 }
            );
        }

        const body = await request.json();

        // Validate input
        const validatedData = flightPlanSchema.parse(body);

        // Extract calculated values
        const { calculatedLift, availablePayload, fuelReserveMinutes } = body;

        // Calculate total passenger weight
        const totalPassengerWeight = validatedData.passengers.reduce((sum, p) => sum + p.weight, 0);

        // Insert into database
        const { data, error } = await supabase
            .from('flight_plans')
            .insert({
                aircraft_type: validatedData.aircraftType,
                aircraft_registration: validatedData.aircraftRegistration || null,
                flight_date: validatedData.flightDate,
                pilot_name: validatedData.pilotName,
                pilot_license: validatedData.pilotLicense || null,
                temperature_celsius: validatedData.temperatureCelsius,
                qnh_hpa: validatedData.qnhHpa || null,
                wind_surface_speed: validatedData.windSurfaceSpeed || null,
                wind_surface_direction: validatedData.windSurfaceDirection || null,
                wind_altitude_1000m_speed: validatedData.windAltitude1000mSpeed || null,
                wind_altitude_1000m_direction: validatedData.windAltitude1000mDirection || null,
                wind_altitude_2000m_speed: validatedData.windAltitude2000mSpeed || null,
                wind_altitude_2000m_direction: validatedData.windAltitude2000mDirection || null,
                calculated_lift_kg: calculatedLift,
                available_payload_kg: availablePayload,
                passengers: validatedData.passengers,
                total_passenger_weight_kg: totalPassengerWeight,
                clothing_luggage_included: validatedData.clothingLuggageIncluded,
                fuel_total_liters: validatedData.fuelTotalLiters,
                fuel_estimated_consumption_liters: validatedData.fuelEstimatedConsumptionLiters,
                fuel_reserve_minutes: fuelReserveMinutes,
                fuel_reserve_sufficient: fuelReserveMinutes >= 30,
                status: 'submitted',
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to save flight plan' }, { status: 500 });
        }

        // Send email notification
        try {
            await sendFlightPlanEmail({
                ...validatedData,
                calculatedLift,
                availablePayload,
                fuelReserveMinutes,
            });

            // Update email sent timestamp
            await supabase
                .from('flight_plans')
                .update({ email_sent_at: new Date().toISOString() })
                .eq('id', data.id);
        } catch (emailError) {
            console.error('Email error:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
