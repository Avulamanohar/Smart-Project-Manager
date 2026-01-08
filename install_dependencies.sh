#!/bin/bash

echo "==================================================="
echo "  Smart Project Manager - Dependency Installer"
echo "==================================================="
echo ""

echo "[1/3] Installing AI Service Dependencies (Python)..."
cd ai-service
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error installing Python dependencies. Make sure python/pip is installed."
    exit 1
fi
cd ..
echo "AI Service dependencies installed."
echo ""

echo "[2/3] Installing Backend Dependencies (Node.js)..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing Backend dependencies."
    exit 1
fi
cd ..
echo "Backend dependencies installed."
echo ""

echo "[3/3] Installing Frontend Dependencies (Node.js)..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing Frontend dependencies."
    exit 1
fi
cd ..
echo "Frontend dependencies installed."
echo ""

echo "==================================================="
echo "  All dependencies installed successfully!"
echo "  You are ready to run the project."
echo "==================================================="
