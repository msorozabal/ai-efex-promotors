#!/bin/bash

echo "==================================="
echo "EFEX Promotor Copilot - Backend"
echo "==================================="

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Copy .env.example to .env if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit backend/.env with your AWS credentials!"
fi

# Run the Flask app
echo ""
echo "Starting Flask server on http://localhost:5000"
echo ""
python app.py
