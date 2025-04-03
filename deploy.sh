#!/bin/bash

# Deployment script for Vercel

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Make sure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "Warning: .env.local not found, but .env.example exists."
        echo "You will need to set up environment variables in the Vercel dashboard."
    else
        echo "Warning: Neither .env.local nor .env.example found."
        echo "Make sure to set up your OPENAI_API_KEY in the Vercel dashboard."
    fi
fi

# Run linting and type checking
echo "Running linting and type checking..."
npm run lint

# Build the project locally to catch any errors
echo "Building project locally to catch errors..."
npm run build

# If we get here, the build was successful
echo "Local build successful."

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel

echo "Deployment process complete." 