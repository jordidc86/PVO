/**
 * Aircraft Database - Registration-based selection
 * Each aircraft has a specific equipment configuration
 */

export interface AircraftEquipment {
    registration: string; // Portuguese registration (CS-XXX)
    model: string; // Balloon model
    serialNumber: string;
    volume_cubic_feet: number;

    // Equipment configuration
    envelope: string;
    basket: string;
    burner: string;
    cylinders: string;

    // Total empty weight (envelope + basket + burner + cylinders)
    empty_weight_kg: number;
}

export const AIRCRAFT_FLEET: AircraftEquipment[] = [
    {
        registration: 'CS-UMA',
        model: 'Ultramagic N-425',
        serialNumber: '425/85',
        volume_cubic_feet: 425000,
        envelope: 'Ultramagic N-425 S/N 425/85',
        basket: 'Ultramagic 4-passenger wicker basket',
        burner: 'Ultramagic MK-32 double burner',
        cylinders: '4x 40L stainless steel cylinders',
        empty_weight_kg: 485, // Dummy - user will provide actual
    },
    {
        registration: 'CS-UMB',
        model: 'Ultramagic N-425',
        serialNumber: '425/101',
        volume_cubic_feet: 425000,
        envelope: 'Ultramagic N-425 S/N 425/101',
        basket: 'Ultramagic 6-passenger wicker basket',
        burner: 'Ultramagic MK-32 triple burner',
        cylinders: '6x 40L stainless steel cylinders',
        empty_weight_kg: 520, // Dummy - user will provide actual
    },
    {
        registration: 'CS-CAM',
        model: 'Cameron Z-450',
        serialNumber: '11609',
        volume_cubic_feet: 450000,
        envelope: 'Cameron Z-450 S/N 11609',
        basket: 'Cameron 8-passenger wicker basket',
        burner: 'Cameron Dual Burner System',
        cylinders: '6x 40L titanium cylinders',
        empty_weight_kg: 550, // Dummy - user will provide actual
    },
];

/**
 * Get aircraft by registration
 */
export function getAircraftByRegistration(registration: string): AircraftEquipment | undefined {
    return AIRCRAFT_FLEET.find(a => a.registration === registration);
}

/**
 * Get all aircraft registrations for dropdown
 */
export function getAllRegistrations(): string[] {
    return AIRCRAFT_FLEET.map(a => a.registration);
}
