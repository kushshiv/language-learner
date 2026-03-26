## Backend App (FastAPI)

Python backend for heavy language-processing and cloud-sync integration.

### Run locally

```bash
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### API docs

- Swagger UI: `http://localhost:8000/docs`
- Health: `GET /api/v1/health`
