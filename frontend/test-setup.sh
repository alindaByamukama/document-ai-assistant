#!/bin/bash
# Quick test script to verify backend setup

echo "🧪 Document AI Assistant - Local Test"
echo "======================================"

# Check Python
echo "\n1. Checking Python..."
python --version || { echo "❌ Python not installed"; exit 1; }

# Check venv
echo "\n2. Checking virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "❌ venv not found. Run: python -m venv backend/venv"
    exit 1
fi

source backend/venv/bin/activate

# Check dependencies
echo "\n3. Checking dependencies..."
pip list | grep -q fastapi && echo "✓ fastapi" || echo "❌ fastapi not installed"
pip list | grep -q unstructured && echo "✓ unstructured" || echo "❌ unstructured not installed"

# Check .env
echo "\n4. Checking .env configuration..."
if [ ! -f "backend/.env" ]; then
    echo "❌ .env not found in backend/"
    echo "   Create one: cp backend/.env.example backend/.env"
    exit 1
fi

# Check if LLM is configured
if grep -q "LLM_TYPE=ollama" backend/.env; then
    echo "✓ Configured for Ollama"
    echo "  Check: Is Ollama running? (ollama serve)"
elif grep -q "LLM_TYPE=huggingface" backend/.env; then
    echo "✓ Configured for HuggingFace"
    echo "  Check: Is HF_API_KEY set?"
fi

# Try importing main modules
echo "\n5. Testing Python imports..."
cd backend
python -c "from main import app; print('✓ FastAPI app imports')" || exit 1
python -c "from llm_handler import LLMHandler; print('✓ LLM handler imports')" || exit 1
cd ..

echo "\n✅ Setup looks good!"
echo "\nTo start:"
echo "  1. Backend: cd backend && python main.py"
echo "  2. Frontend: cd frontend && npm run dev"
echo "  3. Open: http://localhost:3000"
