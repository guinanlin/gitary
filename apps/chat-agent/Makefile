.PHONY: help setup install run test clean dev web

help:
	@echo "Available commands:"
	@echo "  make setup    - Install uv and sync dependencies"
	@echo "  make install  - Sync dependencies with uv"
	@echo "  make run      - Start the FastAPI server (port 8234)"
	@echo "  make dev      - Start ADK Dev UI (port 8334)"
	@echo "  make web      - Alias for 'make dev'"
	@echo "  make test     - Run test suite"
	@echo "  make clean    - Clean up generated files"

setup:
	@if ! command -v uv &> /dev/null; then \
		echo "Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh || pip install uv; \
	fi
	@echo "Syncing dependencies with uv..."
	uv sync --no-install-project
	@echo "✅ Setup complete!"
	@echo "⚠️  Don't forget to:"
	@echo "   1. Copy hello_agent/.env.example to hello_agent/.env"
	@echo "   2. Add your GOOGLE_API_KEY to hello_agent/.env"

install:
	uv sync --no-install-project

run:
	@if [ ! -f "hello_agent/.env" ]; then \
		echo "⚠️  Warning: hello_agent/.env not found!"; \
		echo "Please copy hello_agent/.env.example to hello_agent/.env and add your GOOGLE_API_KEY"; \
		exit 1; \
	fi
	uv run python main.py

test:
	@if [ ! -f "hello_agent/.env" ]; then \
		echo "⚠️  Warning: hello_agent/.env not found!"; \
		echo "Please copy hello_agent/.env.example to hello_agent/.env and add your GOOGLE_API_KEY"; \
		exit 1; \
	fi
	uv run python test_agent.py

dev:
	@if [ ! -f "hello_agent/.env" ]; then \
		echo "⚠️  Warning: hello_agent/.env not found!"; \
		echo "Please copy hello_agent/.env.example to hello_agent/.env and add your GOOGLE_API_KEY"; \
		exit 1; \
	fi
	@ADK_PORT=$${ADK_PORT:-8334}; \
	echo "🚀 Starting ADK Dev UI on port $$ADK_PORT..."; \
	echo "📝 Open http://localhost:$$ADK_PORT in your browser"; \
	echo "📝 Select 'hello_agent' from the dropdown to start chatting"; \
	echo "💡 To use a different port, set ADK_PORT environment variable (e.g., ADK_PORT=8335 make dev)"; \
	uv run adk web --port $$ADK_PORT

web: dev

clean:
	uv clean
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@echo "✅ Clean complete!"
