import os
from typing import Literal
from openai import APIConnectionError, APIError, APITimeoutError, OpenAI, RateLimitError
from pydantic import BaseModel, Field

class AIServiceError(Exception):
    ## AI処理に失敗したときにAPI層へ返す独自例外

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


# --- 1.1. AIに返させるJSON構造（Pydanticスキーマ） ---
class GeneratedChecklistItem(BaseModel):
    category: str = Field(
        description="Station or prep group, e.g., 'Sauces & Stocks', 'Proteins', 'Produce / Garde Manger', 'Dry / Bakery', 'General'"
    )
    task: str = Field(
        description="Concise actionable kitchen task in natural English starting with a strong verb, e.g., 'Reduce veal stock by half'"
    )
    quantity: str = Field(
        default="",
        description="Quantity with unit if mentioned (e.g., '4 L', '12 portions', '300 g'), otherwise empty string",
    )
    priority: Literal["high", "normal"] = Field(
        default="normal",
        description="'high' for time-consuming prep (stocks, braises, doughs) or urgent items, otherwise 'normal'",
    )
    notes: str = Field(
        default="",
        description="Helpful kitchen note such as storage, trim usage, or handover tip, otherwise empty string",
    )

# --- 1.2. AIに返させるJSON構造（Pydanticスキーマ） ---
class GeneratedPrepResult(BaseModel):
    title: str = Field(
        description="Short, clear prep sheet title in English, e.g., 'Dinner Service Prep'"
    )
    organized_notes: str = Field(
        description="Clean summary of general reminders, shift handovers, or storage instructions in English"
    )
    items: list[GeneratedChecklistItem] = Field(
        default_factory=list,
        description="Ordered list of actionable prep checklist items",
    )

# --- 2. システムプロンプト ---
SYSTEM_PROMPT = """You are an experienced Executive Chef and Kitchen Manager.
Convert rough, unstructured kitchen notes (written in any language, shorthand, or mixed notes) into a clean, actionable English prep sheet (mise en place) for a working professional kitchen.

Guidelines:
1. Write concise, natural professional kitchen English using clear action verbs (e.g., "Dice", "Julienne", "Reduce", "Portion", "Blanch", "Label & date", "Pull from walk-in").
2. Group tasks logically by station or prep category (e.g., "Proteins", "Sauces & Stocks", "Produce / Garde Manger", "Bakery / Pastry", "General").
3. Extract quantities accurately when present; leave `quantity` as "" if no quantity is specified.
4. Set `priority` to "high" for slow/time-sensitive prep (stocks, reductions, doughs, braises) or urgent items, and "normal" otherwise.
5. Put broader reminders, storage instructions, or team handovers into `organized_notes` rather than duplicating them as single prep tasks.
6. If a title is provided by the user, refine or keep it clear; otherwise generate a concise English title.
"""

# --- 3. OpenAI呼び出し関数 ---

#OpenAI側のAPIkeyを取得
def _get_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise AIServiceError(
            "OPENAI_API_KEY is not configured on the server.",
            status_code=500,
        )
    return OpenAI(api_key=api_key, timeout=30.0)

#雑多な仕込みメモから、整理済みメモと構造化されたチェックリストを生成する。
def generate_prep_from_notes(raw_notes: str, title: str | None = None) -> GeneratedPrepResult:
    
    cleaned_notes = (raw_notes or "").strip()
    if not cleaned_notes:
        raise AIServiceError("Kitchen notes cannot be empty.", status_code=400)

    client = _get_client()
    model_name = os.environ.get("OPENAI_PREP_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"

    user_prompt_parts = []
    if title and title.strip():
        user_prompt_parts.append(f"Suggested title: {title.strip()}")
    user_prompt_parts.append(f"Raw kitchen notes:\n{cleaned_notes}")
    user_prompt = "\n\n".join(user_prompt_parts)

    try:
        response = client.responses.parse(
            model=model_name,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            text_format=GeneratedPrepResult,
        )
    except RateLimitError as exc:
        raise AIServiceError(
            "AI rate limit reached. Please wait a moment and try again.",
            status_code=429,
        ) from exc
    except APITimeoutError as exc:
        raise AIServiceError(
            "AI request timed out. Try shortening the notes and try again.",
            status_code=504,
        ) from exc
    except APIConnectionError as exc:
        raise AIServiceError(
            "Could not reach the AI service. Please check network connectivity.",
            status_code=502,
        ) from exc
    except APIError as exc:
        raise AIServiceError(
            f"AI service error: {exc.message}",
            status_code=502,
        ) from exc

    parsed: GeneratedPrepResult | None = response.output_parsed
    if parsed is None:
        raise AIServiceError(
            "AI returned an empty or unparseable response.",
            status_code=502,
        )

    return parsed