# Google Calendar Integration Guide

## Overview
The flight plan application can import passenger data directly from Google Calendar events. This feature requires OAuth2 authentication setup.

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Configure OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the consent screen if prompted
4. Choose "Web application" as application type
5. Add authorized redirect URIs:
   - `http://localhost:3001/` (for development)
   - `https://yourdomain.com/` (for production)
6. Copy the **Client ID**

### 3. Add Environment Variables

Add to your `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3001/
```

### 4. Calendar Event Format

To import passengers from a calendar event, add passenger information to the event description in this format:

```
Passengers:
- John Doe, 75kg, +34 600 123 456
- Jane Smith, 68kg, +34 600 654 321
- Mike Johnson, 82kg, +34 600 999 888
```

**Format Rules:**
- Start with "Passengers:" header
- Each passenger on a new line starting with `-` or `*`
- Format: `Name, XXkg, Phone` (phone is optional)
- Weight must include "kg"

### 5. Usage Flow

1. User clicks "📅 Import from Calendar" button
2. User is redirected to Google OAuth consent screen
3. User grants calendar read permission
4. User is redirected back to the app
5. App fetches calendar events for the next 30 days
6. User selects the event for their flight
7. Passenger data is automatically populated

## Implementation Status

✅ **Completed:**
- Calendar API integration module (`src/lib/calendar.ts`)
- Passenger data parsing from event descriptions
- OAuth2 flow functions
- UI button placeholder

⚠️ **Pending:**
- OAuth2 client configuration (requires Google Cloud setup)
- Event selection UI component
- Access token storage (localStorage or session)

## Code Example

```typescript
import { initiateGoogleAuth, fetchCalendarEvents, parsePassengersFromDescription } from '@/lib/calendar';

// Step 1: Initiate OAuth
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;
initiateGoogleAuth(clientId, redirectUri);

// Step 2: After redirect, fetch events
const accessToken = extractAccessTokenFromUrl();
if (accessToken) {
  const events = await fetchCalendarEvents(accessToken);
  
  // Step 3: User selects event, populate passengers
  const selectedEvent = events.find(e => e.id === selectedEventId);
  if (selectedEvent) {
    selectedEvent.passengers.forEach(passenger => {
      append({ name: passenger.name, weight: passenger.weight });
    });
  }
}
```

## Security Considerations

- Access tokens are stored client-side (consider using httpOnly cookies for production)
- Calendar API has rate limits (10,000 requests/day for free tier)
- Only request `calendar.readonly` scope (read-only access)
- Validate all imported data before using

## Alternative: Manual CSV Import

If Google Calendar integration is too complex, consider implementing a CSV import feature:
- User exports calendar events to CSV
- User uploads CSV file
- App parses and imports passenger data

## Support

For issues with Google Calendar API:
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [OAuth2 Guide](https://developers.google.com/identity/protocols/oauth2)
