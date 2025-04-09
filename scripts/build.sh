
#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Ensure local TypeScript is used instead of global
echo "Building with local TypeScript installation..."
npx tsc --noEmit && vite build

echo "Build completed successfully!"
