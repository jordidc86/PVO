/**
 * Weather API Integration
 * Using OpenMeteo for Segovia weather data
 */

const SEGOVIA_COORDS = {
    latitude: 40.9429,
    longitude: -4.1088,
};

export interface WeatherData {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    timestamp: string;
}

export interface WindAtAltitude {
    altitude_m: number;
    speed_kmh: number;
    direction: number;
}

export interface WeatherResponse {
    surface: WeatherData;
    windsAloft: WindAtAltitude[];
}

/**
 * Fetch current weather for Segovia
 */
export async function fetchSegoviaWeather(): Promise<WeatherResponse> {
    try {
        // OpenMeteo API - free, no API key required
        const surfaceUrl = `https://api.open-meteo.com/v1/forecast?latitude=${SEGOVIA_COORDS.latitude}&longitude=${SEGOVIA_COORDS.longitude}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=Europe/Madrid`;

        const surfaceResponse = await fetch(surfaceUrl);
        const surfaceData = await surfaceResponse.json();

        // Winds aloft (using pressure levels as proxy for altitude)
        const windsAloftUrl = `https://api.open-meteo.com/v1/forecast?latitude=${SEGOVIA_COORDS.latitude}&longitude=${SEGOVIA_COORDS.longitude}&hourly=wind_speed_850hPa,wind_direction_850hPa,wind_speed_700hPa,wind_direction_700hPa&forecast_days=1&timezone=Europe/Madrid`;

        const windsResponse = await fetch(windsAloftUrl);
        const windsData = await windsResponse.json();

        // Get current hour index
        const currentHourIndex = 0;

        return {
            surface: {
                temperature: surfaceData.current.temperature_2m,
                windSpeed: surfaceData.current.wind_speed_10m,
                windDirection: surfaceData.current.wind_direction_10m,
                pressure: surfaceData.current.surface_pressure,
                timestamp: surfaceData.current.time,
            },
            windsAloft: [
                {
                    altitude_m: 1500, // ~850 hPa
                    speed_kmh: windsData.hourly.wind_speed_850hPa[currentHourIndex] || 0,
                    direction: windsData.hourly.wind_direction_850hPa[currentHourIndex] || 0,
                },
                {
                    altitude_m: 3000, // ~700 hPa
                    speed_kmh: windsData.hourly.wind_speed_700hPa[currentHourIndex] || 0,
                    direction: windsData.hourly.wind_direction_700hPa[currentHourIndex] || 0,
                },
            ],
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw new Error('Failed to fetch weather data');
    }
}
