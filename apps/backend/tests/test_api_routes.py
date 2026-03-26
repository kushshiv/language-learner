from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_parse_dictionary_endpoint() -> None:
    payload = {
        "filename": "words.json",
        "content": '[{"german":"Haus","english":"house","type":"noun","example":"Das Haus ist groß","article":"das"}]',
    }
    response = client.post("/api/v1/parse/dictionary", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "words" in data
    assert len(data["words"]) == 1
    assert data["words"][0]["german"] == "Haus"
