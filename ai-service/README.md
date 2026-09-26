# ArohaAI Python FastAPI AI Service Boundary

This microservice acts as the AI processing service boundary for ArohaAI.

## Endpoints

- **GET `/health`**: Health check verifying service status.
  - Returns: `{"status": "ok", "service": "aroha-ai"}`

- **POST `/analyze`**: Receives check-in data and returns structured analysis response.
  - Request Body:
    ```json
    {
      "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "response": "Okay"
    }
    ```
  - Response Body:
    ```json
    {
      "checkin_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "indicators": [],
      "change_detected": false,
      "explanation": "Analysis service is connected successfully.",
      "requires_counsellor_review": false
    }
    ```

## Running locally

```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```
