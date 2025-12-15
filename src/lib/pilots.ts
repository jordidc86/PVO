// Pilot database with license validation
export interface Pilot {
    id: string;
    name: string;
    licenseNumber: string;
    licenseType: string;
    licenseExpiry: string;
    medicalExpiry: string;
    proficiencyCheckExpiry: string;
    isValid: boolean;
}

export const PILOTS: Pilot[] = [
    {
        id: '1',
        name: 'Manel Rodriguez',
        licenseNumber: 'BPL(H) 12345',
        licenseType: 'BPL(H)',
        licenseExpiry: '2026-06-15',
        medicalExpiry: '2025-12-31',
        proficiencyCheckExpiry: '2025-11-30',
        isValid: true,
    },
    {
        id: '2',
        name: 'Jose Luis Calderon',
        licenseNumber: 'BPL(H) 23456',
        licenseType: 'BPL(H)',
        licenseExpiry: '2027-03-20',
        medicalExpiry: '2026-01-15',
        proficiencyCheckExpiry: '2025-10-10',
        isValid: true,
    },
    {
        id: '3',
        name: 'Luis Ferreira',
        licenseNumber: 'BPL(H) 34567',
        licenseType: 'BPL(H)',
        licenseExpiry: '2025-09-10',
        medicalExpiry: '2025-08-20',
        proficiencyCheckExpiry: '2025-07-15',
        isValid: false, // Expired proficiency check
    },
];

/**
 * Validate pilot requirements
 */
export function validatePilot(pilot: Pilot): {
    isValid: boolean;
    warnings: string[];
} {
    const warnings: string[] = [];
    const today = new Date();

    // Check license expiry
    if (new Date(pilot.licenseExpiry) < today) {
        warnings.push('License expired');
    }

    // Check medical expiry
    if (new Date(pilot.medicalExpiry) < today) {
        warnings.push('Medical certificate expired');
    }

    // Check proficiency check expiry
    if (new Date(pilot.proficiencyCheckExpiry) < today) {
        warnings.push('Proficiency check expired');
    }

    // Check if expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (new Date(pilot.licenseExpiry) < thirtyDaysFromNow && new Date(pilot.licenseExpiry) > today) {
        warnings.push('License expiring within 30 days');
    }

    if (new Date(pilot.medicalExpiry) < thirtyDaysFromNow && new Date(pilot.medicalExpiry) > today) {
        warnings.push('Medical expiring within 30 days');
    }

    if (new Date(pilot.proficiencyCheckExpiry) < thirtyDaysFromNow && new Date(pilot.proficiencyCheckExpiry) > today) {
        warnings.push('Proficiency check expiring within 30 days');
    }

    return {
        isValid: warnings.filter(w => w.includes('expired')).length === 0,
        warnings,
    };
}

/**
 * Get pilot by ID
 */
export function getPilotById(id: string): Pilot | undefined {
    return PILOTS.find(p => p.id === id);
}

/**
 * Get pilot by name
 */
export function getPilotByName(name: string): Pilot | undefined {
    return PILOTS.find(p => p.name.toLowerCase() === name.toLowerCase());
}
