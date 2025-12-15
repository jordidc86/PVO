import { Resend } from 'resend';
import { FlightPlanFormData } from './schemas';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendFlightPlanEmail(
    flightPlan: FlightPlanFormData & {
        calculatedLift?: number;
        availablePayload?: number;
        fuelReserveMinutes?: number;
    }
) {
    const emailBody = generatePlainTextEmail(flightPlan);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Flight Plans <noreply@voyagerballoons.com>',
            to: [process.env.NOTIFICATION_EMAIL || 'info@voyagerballoons.com'],
            subject: `Flight Plan - ${flightPlan.pilotName} - ${flightPlan.flightDate}`,
            text: emailBody,
        });

        if (error) {
            throw new Error(`Email error: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

function generatePlainTextEmail(
    flightPlan: FlightPlanFormData & {
        calculatedLift?: number;
        availablePayload?: number;
        fuelReserveMinutes?: number;
    }
): string {
    const totalPaxWeight = flightPlan.passengers.reduce((sum, p) => sum + p.weight, 0);

    return `
OPERATIONAL FLIGHT PLAN
========================

AIRCRAFT INFORMATION
--------------------
Type: ${flightPlan.aircraftType?.toUpperCase() || 'N/A'}
Registration: ${flightPlan.aircraftRegistration || 'N/A'}

FLIGHT DETAILS
--------------
Date: ${flightPlan.flightDate}
Pilot: ${flightPlan.pilotName}
License: ${flightPlan.pilotLicense || 'N/A'}

WEATHER CONDITIONS
------------------
Source: OpenMeteo API (Segovia: 40.9429°N, 4.1088°W)
Temperature: ${flightPlan.temperatureCelsius}°C
QNH: ${flightPlan.qnhHpa || 'N/A'} hPa
Surface Wind: ${flightPlan.windSurfaceSpeed || 'N/A'} km/h @ ${flightPlan.windSurfaceDirection || 'N/A'}°
Wind @ 1000m: ${flightPlan.windAltitude1000mSpeed || 'N/A'} km/h @ ${flightPlan.windAltitude1000mDirection || 'N/A'}°
Wind @ 2000m: ${flightPlan.windAltitude2000mSpeed || 'N/A'} km/h @ ${flightPlan.windAltitude2000mDirection || 'N/A'}°


PERFORMANCE CALCULATIONS
------------------------
Calculated Lift: ${flightPlan.calculatedLift?.toFixed(2) || 'N/A'} kg
Available Payload: ${flightPlan.availablePayload?.toFixed(2) || 'N/A'} kg

PASSENGER MANIFEST
------------------
${flightPlan.passengers.map((p, i) => `${i + 1}. ${p.name} - ${p.weight} kg`).join('\n')}

Total Passenger Weight: ${totalPaxWeight} kg
Clothing/Luggage Weight Included: ${flightPlan.clothingLuggageIncluded ? 'YES' : 'NO'}

FUEL MANAGEMENT
---------------
Total Fuel: ${flightPlan.fuelTotalLiters} L
Estimated Consumption: ${flightPlan.fuelEstimatedConsumptionLiters} L
Reserve: ${flightPlan.fuelReserveMinutes || 'N/A'} minutes
Reserve Sufficient (≥30 min): ${(flightPlan.fuelReserveMinutes || 0) >= 30 ? 'YES ✓' : 'NO ✗'}

========================
Generated: ${new Date().toISOString()}
  `.trim();
}
