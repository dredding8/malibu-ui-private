#!/bin/bash

# Malibu UI Private Deployment Script
set -e

echo "🚀 Starting Malibu UI Private Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm ci
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Error: Build failed. No build directory found."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deployment options
echo ""
echo "Choose your deployment method:"
echo "1) Docker (Local/Private Server)"
echo "2) Upload to private server via SCP"
echo "3) Deploy to Vercel (Private)"
echo "4) Deploy to Netlify (Private)"
echo "5) GitHub Pages (Private)"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🐳 Deploying with Docker..."
        docker build -t malibu-ui .
        docker run -d -p 3000:80 --name malibu-ui-container malibu-ui
        echo "✅ Application deployed at http://localhost:3000"
        ;;
    2)
        read -p "Enter server hostname/IP: " server
        read -p "Enter username: " username
        read -p "Enter deployment path: " path
        echo "📤 Uploading to private server..."
        scp -r build/* $username@$server:$path
        echo "✅ Upload completed!"
        ;;
    3)
        echo "🔗 Deploying to Vercel..."
        npx vercel --prod
        echo "✅ Deployed to Vercel!"
        ;;
    4)
        echo "🔗 Deploying to Netlify..."
        npx netlify deploy --prod --dir=build
        echo "✅ Deployed to Netlify!"
        ;;
    5)
        echo "🔗 Pushing to GitHub for Pages deployment..."
        git add .
        git commit -m "deploy: update build for GitHub Pages"
        git push origin main
        echo "✅ Pushed to GitHub. Check Actions tab for deployment status."
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed successfully!"
echo "📋 Next steps:"
echo "   - Test your application"
echo "   - Set up monitoring if needed"
echo "   - Configure SSL certificates for production"
