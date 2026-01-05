#!/bin/bash

echo "==================================="
echo "EFEX Promotor Copilot - Frontend"
echo "==================================="

cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the React development server
echo ""
echo "Starting React development server on http://localhost:3000"
echo ""
npm start
