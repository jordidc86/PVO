/**
 * Balloon Performance Calculations
 * Based on hot air balloon physics and EASA requirements
 */

export interface BalloonSpec {
    type: 'ultramagic-425' | 'cameron-450';
    volume_cubic_feet: number;
    empty_weight_kg: number; // Balloon + basket + equipment
}

export const BALLOON_SPECS: Record<string, BalloonSpec> = {
    'ultramagic-425': {
        type: 'ultramagic-425',
        volume_cubic_feet: 425000,
        empty_weight_kg: 450, // Approximate - user should verify
    },
    'cameron-450': {
        type: 'cameron-450',
        volume_cubic_feet: 450000,
        empty_weight_kg: 480, // Approximate - user should verify
    },
};

/**
 * Calculate lift capacity based on temperature differential
 * Formula: Lift = Volume * Air_Density_Difference
 * 
 * Simplified calculation:
 * - Hot air temp inside envelope: ~100°C (typical operating temp)
 * - Lift per 1000 cu ft ≈ 7.5 kg at sea level with 80°C differential
 */
export function calculateLift(
    volumeCubicFeet: number,
    ambientTempCelsius: number,
    altitudeMSL: number = 1000 // Segovia altitude ~1000m
): number {
    const hotAirTemp = 100; // °C - typical envelope temperature
    const tempDifferential = hotAirTemp - ambientTempCelsius;

    // Adjust for altitude (air density decreases with altitude)
    const altitudeFactor = 1 - (altitudeMSL / 10000) * 0.1;

    // Base lift: ~7.5 kg per 1000 cu ft at sea level with 80°C differential
    const baseLiftPer1000CuFt = 7.5;
    const adjustedLift = (volumeCubicFeet / 1000) * baseLiftPer1000CuFt * (tempDifferential / 80) * altitudeFactor;

    return Math.round(adjustedLift * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate available payload
 */
export function calculateAvailablePayload(
    totalLift: number,
    balloonEmptyWeight: number,
    fuelWeight: number
): number {
    return Math.max(0, totalLift - balloonEmptyWeight - fuelWeight);
}

/**
 * Calculate fuel reserve in minutes
 * AMC1 BOP.BAS.160 requires documented calculation
 */
export function calculateFuelReserve(
    totalFuelLiters: number,
    estimatedConsumptionLiters: number,
    consumptionRateLitersPerHour: number = 40 // Based on manufacturer data/pilot experience
): number {
    const reserveFuel = totalFuelLiters - estimatedConsumptionLiters;
    const reserveMinutes = (reserveFuel / consumptionRateLitersPerHour) * 60;
    return Math.round(reserveMinutes);
}

/**
 * Check if fuel reserve meets required criterion
 * Standard: 30 min (AMC1 BOP.BAS.160)
 * Min: 15 min (Operation local / single tank)
 */
export function isFuelReserveSufficient(reserveMinutes: number, criterion: '30min' | '15min' = '30min'): boolean {
    const minRequired = criterion === '15min' ? 15 : 30;
    return reserveMinutes >= minRequired;
}

/**
 * Convert liters of propane to kg (for weight calculations)
 * Propane density: ~0.51 kg/L
 */
export function fuelLitersToKg(liters: number): number {
    return Math.round(liters * 0.51 * 100) / 100;
}

/**
 * Calculate Take-Off Mass (TOM)
 * TOM = Empty Mass + Fuel Mass + Traffic Load
 */
export function calculateTOM(
    emptyMassKg: number,
    fuelMassKg: number,
    trafficLoadKg: number
): number {
    return Math.round((emptyMassKg + fuelMassKg + trafficLoadKg) * 100) / 100;
}
