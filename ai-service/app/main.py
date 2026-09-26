from fastapi import FastAPI, HTTPException, status
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.service import process_checkin_analysis

app = FastAPI(
    title="ArohaAI Analysis Service",
    version="1.0.0",
    description="Boundary microservice for processing check-in data."
)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "ok",
        "service": "aroha-ai"
    }


@app.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK)
def analyze_checkin(request: AnalyzeRequest):
    try:
        return process_checkin_analysis(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during check-in analysis processing."
        )
