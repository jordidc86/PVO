# EASA Balloon Flight Plan

Modern web application for creating Operational Flight Plans (OFP) for commercial hot air balloon operations.

## 🚀 Live Demo

[Coming soon - Deploy to Netlify]

## ✨ Features

- **Aircraft Management**: Portuguese fleet (CS-UMA, CS-UMB, CS-CAM) with detailed equipment configs
- **Pilot Database**: Auto-fill license data with validation warnings
- **Real-time Weather**: OpenMeteo API integration for Segovia
- **Performance Calculations**: Automatic lift, payload, and fuel reserve calculations
- **Pilot Declaration**: Pre-flight compliance (alcohol/drugs, rest, inspection)
- **Passenger Manifest**: Dynamic list with weight tracking
- **Email Notifications**: Automatic reports to info@voyagerballoons.com
- **Database Storage**: Supabase for audit trail

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Supabase
- Resend (Email)
- OpenMeteo API

## 📋 Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see `env.example`)

4. Run development server:
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `NOTIFICATION_EMAIL`

## 📚 Documentation

- [Google Calendar Setup](./GOOGLE_CALENDAR_SETUP.md)
- [Supabase Schema](./supabase-schema.sql)

## 📄 License

MIT
