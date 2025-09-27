format:
	black .
	isort .

lint:
	flake8 .
	mypy app

env:
	@if [ ! -d ".venv" ]; then \
		echo "🔧 Creando entorno virtual..."; \
		python -m venv .venv; \
		.venv/Scripts/pip install -r requirements.txt; \
	else \
		echo "✅ Entorno ya existe."; \
	fi 
