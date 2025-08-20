<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js TypeScript project for event participant verification with QR code scanning.

## Project Context
- Built with Next.js 15, TypeScript, and Tailwind CSS
- Uses App Router (app directory structure)
- Integrates with Google Sheets API for participant verification and attendance tracking
- Mobile-first responsive design for QR scanning workflow

## Key Features
- QR code input with auto-focus for mobile scanners
- Real-time participant verification via Google Sheets API
- Automatic attendance marking with timestamp
- Loading states and error handling
- Responsive UI with Tailwind CSS

## API Integration
- Google Sheets API via googleapis library
- Service Account authentication
- GET endpoint for participant verification
- POST endpoint for marking attendance
- Environment-based configuration

## Database Structure (Google Sheets)
- Column A: Participant ID (unique identifier)
- Column B: Full Name
- Column C: Institution/Organization
- Column D: Attendance Status (auto-filled with timestamp)

## Development Guidelines
- Use TypeScript strict mode
- Follow Next.js App Router conventions
- Implement proper loading and error states
- Ensure mobile-first responsive design
- Use Tailwind CSS for styling
- Protect environment variables in .env.local
- Follow Google Sheets API best practices
