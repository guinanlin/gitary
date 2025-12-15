.PHONY: help setup install run test clean dev web

help:
	@echo "Available commands:"
	@echo "  make setup    - Install uv and sync dependencies"
	@echo "  make install  - Sync dependencies with uv"
	@echo "  make run      - Start the FastAPI server (port 8234)"
	@echo "  make dev      - Start ADK Dev UI (port 8334, all agents)"
	@echo "  make dev CATEGORY=<category>  - Start ADK Dev UI for specific category"
	@echo "                                   Categories: general, business, content"
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
	@echo "   1. Copy src/agents/hello_agent/.env.example to src/agents/hello_agent/.env"
	@echo "   2. Add your GOOGLE_API_KEY to src/agents/hello_agent/.env"

install:
	uv sync --no-install-project

run:
	@if [ ! -f "src/agents/hello_agent/.env" ]; then \
		echo "⚠️  Warning: src/agents/hello_agent/.env not found!"; \
		echo "Please copy src/agents/hello_agent/.env.example to src/agents/hello_agent/.env and add your GOOGLE_API_KEY"; \
		exit 1; \
	fi
	uv run python -m src.main

test:
	@if [ ! -f "src/agents/hello_agent/.env" ]; then \
		echo "⚠️  Warning: src/agents/hello_agent/.env not found!"; \
		echo "Please copy src/agents/hello_agent/.env.example to src/agents/hello_agent/.env and add your GOOGLE_API_KEY"; \
		exit 1; \
	fi
	uv run python -m pytest tests/

dev:
	@ADK_PORT=$${ADK_PORT:-8334}; \
	CATEGORY=$${CATEGORY:-}; \
	if [ -n "$$CATEGORY" ]; then \
		if [ ! -d "src/agents/$$CATEGORY" ]; then \
			echo "❌ Error: Category '$$CATEGORY' not found!"; \
			echo "Available categories: general, business, content"; \
			exit 1; \
		fi; \
		AGENT_DIR="src/agents/$$CATEGORY"; \
		echo "🚀 Starting ADK Dev UI for category '$$CATEGORY' on port $$ADK_PORT..."; \
		echo "📝 Open http://localhost:$$ADK_PORT in your browser"; \
		echo "📝 Available agents in $$CATEGORY:"; \
		for agent in $$AGENT_DIR/*/; do \
			if [ -d "$$agent" ] && ([ -f "$$agent/agent.py" ] || [ -f "$$agent/root_agent.yaml" ]); then \
				echo "   - $$(basename $$agent)"; \
			fi; \
		done; \
		cd $$AGENT_DIR && uv run adk web --port $$ADK_PORT; \
	else \
		if [ ! -f "src/agents/hello_agent/.env" ]; then \
			echo "⚠️  Warning: src/agents/hello_agent/.env not found!"; \
			echo "Please copy src/agents/hello_agent/.env.example to src/agents/hello_agent/.env and add your GOOGLE_API_KEY"; \
			exit 1; \
		fi; \
		echo "🚀 Starting ADK Dev UI for all agents on port $$ADK_PORT..."; \
		echo "📝 Open http://localhost:$$ADK_PORT in your browser"; \
		echo "📝 Available agents:"; \
		for category in src/agents/*/; do \
			if [ -d "$$category" ] && [ "$$(basename $$category)" != "__pycache__" ]; then \
				for agent in $$category*/; do \
					if [ -d "$$agent" ] && ([ -f "$$agent/agent.py" ] || [ -f "$$agent/root_agent.yaml" ]); then \
						echo "   - $$(basename $$agent) ($$(basename $$category))"; \
					fi; \
				done; \
			fi; \
		done; \
		echo "💡 To start only a specific category, use: make dev CATEGORY=<category>"; \
		echo "💡 Available categories: general, business, content"; \
		cd src/agents && uv run adk web --port $$ADK_PORT; \
	fi

web: dev

clean:
	uv clean
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@echo "✅ Clean complete!"
