"""AI Chat router — /api/ai"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types

from config import settings
from middleware.auth import get_current_customer
from models.user import User

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def ai_chat(req: ChatRequest, current_user: User = Depends(get_current_customer)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key is not configured.")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        system_instruction = (
            f"You are the GDB AI Assistant for Global Digital Bank. "
            f"You are talking to a customer named {current_user.full_name}. "
            "Be helpful, professional, and concise. Only answer questions related to banking, finance, "
            "investments, or their account. Do not provide concrete financial advice. If they ask about "
            "their balance, pretend to check and say you cannot access real-time balances right now due to security."
        )

        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=req.message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        return {"response": response.text}

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="Our AI is currently taking a coffee break. Please try again later.")
