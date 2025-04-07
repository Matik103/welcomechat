# Welcome Chat Client Management

A client management dashboard built with React, TypeScript, and Supabase, developed for [lovable.dev](https://lovable.dev).

## Features

- Client Management Dashboard
- Real-time Client List with Search
- Client Status Tracking
- Responsive Design with Modern UI
- Integration with Supabase Backend

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **State Management**: React Hooks
- **Build Tool**: Vite
- **Package Manager**: npm

## Prerequisites

- Node.js (v18 or higher)
- npm
- Supabase Account

## Environment Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Building for Production

```bash
npm run build
```

## Project Structure

```
src/
  ├── components/     # React components
  ├── hooks/         # Custom React hooks
  ├── integrations/  # External service integrations
  ├── pages/         # Page components
  ├── types/         # TypeScript type definitions
  └── utils/         # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. All rights reserved by [lovable.dev](https://lovable.dev).
