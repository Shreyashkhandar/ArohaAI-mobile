from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "aroha-ai"}
    print("[PASS] Test 1: GET /health status 200 OK")


def test_normal_positive_checkin():
    payload = {
        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa1",
        "response": "I had a good morning and went for a walk."
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["indicators"] == []
    assert data["requires_counsellor_review"] is False
    assert data["change_detected"] is False
    print("[PASS] Test 2: Normal positive check-in (no invented indicators)")


def test_distress_checkin():
    payload = {
        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa2",
        "response": "I have been feeling very overwhelmed lately."
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "distress-related language" in data["indicators"]
    assert data["requires_counsellor_review"] is True
    print("[PASS] Test 3: Distress-related check-in (distress indicator detected)")


def test_sleep_checkin():
    payload = {
        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa3",
        "response": "I haven't been sleeping properly."
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "sleep difficulty" in data["indicators"]
    assert data["requires_counsellor_review"] is True
    print("[PASS] Test 4: Sleep difficulty check-in (sleep indicator detected)")


def test_short_response():
    payload = {
        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa4",
        "response": "Okay"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["indicators"] == []
    assert data["requires_counsellor_review"] is False
    assert "insufficient information" in data["explanation"].lower()
    print("[PASS] Test 5: Short response ('Okay' handled with zero invented indicators)")


def test_empty_response():
    payload = {
        "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa5",
        "response": ""
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["indicators"] == []
    assert data["requires_counsellor_review"] is False
    print("[PASS] Test 6: Empty response handled safely")


def test_invalid_pydantic_payload():
    payload = {
        "user_id": "invalid-uuid",
        "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "response": "Test"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 422
    print("[PASS] Test 7: Invalid UUID payload rejected by Pydantic (HTTP 422)")


if __name__ == "__main__":
    test_health()
    test_normal_positive_checkin()
    test_distress_checkin()
    test_sleep_checkin()
    test_short_response()
    test_empty_response()
    test_invalid_pydantic_payload()
    print("\nALL FASTAPI SERVICE TESTS PASSED SUCCESSFULLY!")
