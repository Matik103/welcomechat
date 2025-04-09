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

# PDF Processing Test Suite

This repository contains tools for testing large-scale PDF text extraction capabilities using the RapidAPI PDF-to-Text converter service.

## Features

- Generates large PDF files with structured content
- Tests PDF-to-text conversion with files of various sizes
- Provides detailed conversion metrics and content verification
- Supports files up to 50MB with proper formatting

## Requirements

- bash
- enscript
- ghostscript (ps2pdf)
- curl
- RapidAPI account with PDF-to-Text converter API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pdf-processing-tests.git
cd pdf-processing-tests
```

2. Install required tools:
```bash
# macOS
brew install enscript ghostscript

# Ubuntu/Debian
sudo apt-get install enscript ghostscript
```

3. Set up your RapidAPI key in the script or as an environment variable:
```bash
export RAPIDAPI_KEY="your_api_key_here"
```

## Usage

1. Make the script executable:
```bash
chmod +x test-pdf-api.sh
```

2. Run the test:
```bash
./test-pdf-api.sh
```

The script will:
- Generate a large PDF file with 500 chapters
- Convert the PDF to text using RapidAPI
- Show samples of the extracted text
- Provide conversion metrics

## Output

The script creates a `test-assets` directory containing:
- `large-test.pdf`: The generated test PDF
- `large-test_response.txt`: The extracted text from the PDF

## Configuration

You can modify these variables in the script:
- Number of chapters (default: 500)
- Content per chapter
- PDF formatting settings
- Output directory

## License

MIT License - feel free to use and modify as needed.
