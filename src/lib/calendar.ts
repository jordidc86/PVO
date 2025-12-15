/**
 * Google Calendar Integration for Passenger Data
 * 
 * This module provides functionality to import passenger information
 * from Google Calendar events.
 */

export interface CalendarPassenger {
    name: string;
    weight: number;
    phone?: string;
}

export interface CalendarEvent {
    id: string;
    summary: string;
    start: string;
    passengers: CalendarPassenger[];
}

/**
 * Parse passenger data from calendar event description
 * Expected format in event description:
 * 
 * Passengers:
 * - John Doe, 75kg, +34 600 123 456
 * - Jane Smith, 68kg, +34 600 654 321
 */
export function parsePassengersFromDescription(description: string): CalendarPassenger[] {
    const passengers: CalendarPassenger[] = [];

    // Look for "Passengers:" section
    const passengersMatch = description.match(/Passengers?:\s*([\s\S]*?)(?:\n\n|$)/i);
    if (!passengersMatch) return passengers;

    const passengersText = passengersMatch[1];
    const lines = passengersText.split('\n');

    for (const line of lines) {
        // Match format: "- Name, XXkg, +phone"
        const match = line.match(/^[-*]\s*([^,]+),\s*(\d+)\s*kg(?:,\s*(.+))?/i);
        if (match) {
            passengers.push({
                name: match[1].trim(),
                weight: parseInt(match[2]),
                phone: match[3]?.trim(),
            });
        }
    }

    return passengers;
}

/**
 * Fetch events from Google Calendar
 * Note: This requires OAuth2 authentication setup
 */
export async function fetchCalendarEvents(
    accessToken: string,
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        singleEvents: 'true',
        orderBy: 'startTime',
    });

    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        start: item.start.dateTime || item.start.date,
        passengers: parsePassengersFromDescription(item.description || ''),
    }));
}

/**
 * Initialize Google Calendar OAuth2 flow
 * This will redirect the user to Google's consent screen
 */
export function initiateGoogleAuth(clientId: string, redirectUri: string) {
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: scope,
    })}`;

    window.location.href = authUrl;
}

/**
 * Extract access token from URL hash after OAuth redirect
 */
export function extractAccessTokenFromUrl(): string | null {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('access_token');
}
