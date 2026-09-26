import os
import json
import httpx
from typing import List
from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.prompts import SYSTEM_PROMPT

ALLOWED_INDICATORS = {
    "distress-related language",
    "fear-related expression",
    "hopelessness-related language",
    "social withdrawal language",
    "sleep difficulty",
    "routine disruption",
    "communication difficulty",
}

SHORT_RESPONSES = {"ok", "okay", "fine", "good", "yes", "no", "great", "nothing", "normal"}


def is_short_or_insufficient(text: str) -> bool:
    cleaned = text.strip().lower()
    if not cleaned:
        return True
    words = cleaned.split()
    if len(words) <= 2 and (cleaned in SHORT_RESPONSES or words[0] in SHORT_RESPONSES):
        return True
    return False


def process_checkin_analysis(request: AnalyzeRequest) -> AnalyzeResponse:
    checkin_text = request.response.strip()

    # 1. Handle empty or short responses deterministically
    if is_short_or_insufficient(checkin_text):
        return AnalyzeResponse(
            checkin_id=request.checkin_id,
            indicators=[],
            change_detected=False,
            explanation="Check-in text contains insufficient information for meaningful linguistic analysis.",
            requires_counsellor_review=False,
        )

    api_key = os.getenv("LLM_API_KEY", "").strip()

    # 2. If API Key is not configured, run rule-based linguistic indicator matching
    if not api_key or api_key == "your_llm_api_key_here":
        return fallback_linguistic_analysis(request.checkin_id, checkin_text)

    # 3. Call LLM Provider (OpenAI-compatible endpoint)
    base_url = os.getenv("LLM_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/").rstrip("/")
    model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")
    endpoint = f"{base_url}/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"User check-in text: \"{checkin_text}\""},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(endpoint, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"LLM API returned status HTTP {resp.status_code}")

            res_data = resp.json()
            content_str = res_data["choices"][0]["message"]["content"]
            parsed_json = json.loads(content_str)

            # Extract & sanitize indicators
            raw_indicators = parsed_json.get("indicators", [])
            sanitized_indicators: List[str] = []
            for ind in raw_indicators:
                ind_clean = str(ind).strip().lower()
                if ind_clean in ALLOWED_INDICATORS and ind_clean not in sanitized_indicators:
                    sanitized_indicators.append(ind_clean)

            sanitized_indicators = sanitized_indicators[:5]

            explanation = str(parsed_json.get("explanation", "")).strip()
            if not explanation:
                if sanitized_indicators:
                    explanation = f"Linguistic indicators detected: {', '.join(sanitized_indicators)}."
                else:
                    explanation = "Check-in text analyzed. No specific concern indicators detected."

            requires_review = bool(parsed_json.get("requires_counsellor_review", False)) or len(sanitized_indicators) > 0

            return AnalyzeResponse(
                checkin_id=request.checkin_id,
                indicators=sanitized_indicators,
                change_detected=False,
                explanation=explanation,
                requires_counsellor_review=requires_review,
            )
    except Exception as err:
        raise RuntimeError(f"LLM analysis failed: {err}")


def fallback_linguistic_analysis(checkin_id, text: str) -> AnalyzeResponse:
    text_lower = text.lower()
    indicators = []

    if any(w in text_lower for w in ["sleep", "sleeping", "insomnia", "nightmare", "awake"]):
        indicators.append("sleep difficulty")
    if any(w in text_lower for w in ["overwhelmed", "distress", "sad", "upset", "crying", "anxious", "stress", "difficult", "not great"]):
        indicators.append("distress-related language")
    if any(w in text_lower for w in ["afraid", "scared", "fear", "fearful"]):
        indicators.append("fear-related expression")
    if any(w in text_lower for w in ["hopeless", "giving up", "no point"]):
        indicators.append("hopelessness-related language")
    if any(w in text_lower for w in ["isolated", "alone", "withdrawn"]):
        indicators.append("social withdrawal language")

    requires_review = len(indicators) > 0

    if indicators:
        explanation = f"Language indicating {', '.join(indicators)} was detected."
    else:
        explanation = "Check-in text analyzed. No specific concern indicators detected."

    return AnalyzeResponse(
        checkin_id=checkin_id,
        indicators=indicators,
        change_detected=False,
        explanation=explanation,
        requires_counsellor_review=requires_review,
    )
