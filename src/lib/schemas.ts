import { z } from 'zod';

export const passengerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    weight: z.number().min(1, 'Weight must be positive').max(200, 'Weight seems unrealistic'),
    hasSpecialNeeds: z.boolean(),
});

export const flightPlanSchema = z.object({
    // Identification
    flightID: z.string().optional(),
    preparedBy: z.string().min(1, 'Prepared by is required'),

    // Aircraft
    aircraftType: z.string().optional(),
    aircraftRegistration: z.string().min(1, 'Aircraft registration is required'),
    massDeterminationMethod: z.literal('declared'),

    // Flight Details
    flightDate: z.string().min(1, 'Flight date is required'),
    pilotName: z.string().min(1, 'Pilot name is required'),
    pilotLicense: z.string().optional(),

    // Pre-flight & Aeronautical Info
    weatherSource: z.string().min(1, 'Weather source is required'),
    weatherObsInSitu: z.string().optional(),
    airspaceAffected: z.string().optional(),
    notamsChecked: z.boolean().refine(val => val === true, 'NOTAMs must be checked'),
    notamReference: z.string().optional(),
    frequenciesATS: z.string().optional(),

    // Alternative Plan (Plan B)
    alternativePlan: z.string().min(1, 'Alternative plan is required'),
    alternativeCriteria: z.string().min(1, 'Alternative criteria is required'),

    // Validations & AFM
    meteoMinimaVFR: z.boolean().refine(val => val === true, 'Meteo must be above VFR minima'),
    afmLimitationsCheck: z.boolean().refine(val => val === true, 'Must be within AFM limitations'),
    takeOffConditionsOK: z.boolean().refine(val => val === true, 'Take-off conditions must be OK'),
    landingConditionsOK: z.boolean().refine(val => val === true, 'Landing conditions must be OK'),

    // Pilot Declaration
    pilotDeclarationAlcoholDrugs: z.boolean().refine(val => val === true, 'Pilot must declare no alcohol/drugs'),
    pilotDeclarationRest: z.boolean().refine(val => val === true, 'Pilot must declare adequate rest'),
    pilotDeclarationPreFlight: z.boolean().refine(val => val === true, 'Pilot must complete pre-flight inspection'),
    noSmoking: z.boolean().refine(val => val === true, 'No smoking must be agreed'),
    noWeapons: z.boolean().refine(val => val === true, 'No weapons must be agreed'),

    // Weather Data
    temperatureCelsius: z.number().min(-20).max(50),
    qnhHpa: z.number().optional(),
    windSurfaceSpeed: z.number().optional(),
    windSurfaceDirection: z.number().optional(),
    windAltitude1000mSpeed: z.number().optional(),
    windAltitude1000mDirection: z.number().optional(),
    windAltitude2000mSpeed: z.number().optional(),
    windAltitude2000mDirection: z.number().optional(),

    // Risk Assessment
    riskCheckPowerLines: z.boolean(),
    riskCheckSolarCells: z.boolean(),
    riskCheckWildlifeAreas: z.boolean(),
    riskCheckCityCenterNoWind: z.boolean(),
    specialRiskNotes: z.string().optional(),
    landingOptionsTypical: z.string().optional(),
    landingOptionsAvoid: z.string().optional(),

    // Alerting & FPL
    atsFplStatus: z.enum(['yes', 'no', 'not_required']),
    atsFplRef: z.string().optional(),
    alertingResponsiblePerson: z.string().optional(),
    alertingOverdueProcedure: z.boolean(),

    // Passengers
    passengers: z.array(passengerSchema).min(1, 'At least one passenger required'),
    clothingLuggageIncluded: z.boolean(),
    passengerBriefingCompleted: z.boolean().refine(val => val === true, 'Passenger briefing must be completed'),
    dangerousGoodsBriefing: z.boolean().refine(val => val === true, 'DG briefing must be completed'),

    // Fuel Management
    fuelTotalLiters: z.number().min(1, 'Total fuel is required'),
    fuelEstimatedConsumptionLiters: z.number().min(1, 'Estimated consumption is required'),
    fuelReserveCriterion: z.enum(['30min', '15min']),
    fuelReserveJustification: z.string().optional(),
    fuelConsumptionSource: z.string().optional(),
});

export type FlightPlanFormData = z.infer<typeof flightPlanSchema>;
export type Passenger = z.infer<typeof passengerSchema>;
