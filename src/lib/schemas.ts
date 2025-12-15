import { z } from 'zod';

export const passengerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    weight: z.number().min(1, 'Weight must be positive').max(200, 'Weight seems unrealistic'),
});

export const flightPlanSchema = z.object({
    // Aircraft
    aircraftType: z.string().optional(),
    aircraftRegistration: z.string().min(1, 'Aircraft registration is required'),

    // Flight Details
    flightDate: z.string().min(1, 'Flight date is required'),
    pilotName: z.string().min(1, 'Pilot name is required'),
    pilotLicense: z.string().optional(),

    // Pilot Declaration
    pilotDeclarationAlcoholDrugs: z.boolean().refine(val => val === true, 'Pilot must declare no alcohol/drugs'),
    pilotDeclarationRest: z.boolean().refine(val => val === true, 'Pilot must declare adequate rest'),
    pilotDeclarationPreFlight: z.boolean().refine(val => val === true, 'Pilot must complete pre-flight inspection'),

    // Weather
    temperatureCelsius: z.number().min(-20).max(50),
    qnhHpa: z.number().optional(),
    windSurfaceSpeed: z.number().optional(),
    windSurfaceDirection: z.number().optional(),
    windAltitude1000mSpeed: z.number().optional(),
    windAltitude1000mDirection: z.number().optional(),
    windAltitude2000mSpeed: z.number().optional(),
    windAltitude2000mDirection: z.number().optional(),

    // Passengers
    passengers: z.array(passengerSchema).min(1, 'At least one passenger required'),
    clothingLuggageIncluded: z.boolean(),

    // Fuel
    fuelTotalLiters: z.number().min(1, 'Total fuel is required'),
    fuelEstimatedConsumptionLiters: z.number().min(1, 'Estimated consumption is required'),
});

export type FlightPlanFormData = z.infer<typeof flightPlanSchema>;
export type Passenger = z.infer<typeof passengerSchema>;
