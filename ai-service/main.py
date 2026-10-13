
import time
import hashlib
import json
import re
from typing import Any, Dict, List, Tuple

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from agent.agent import build_agent


app = FastAPI(title="TripPilot AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://trip-pilot-ai-7j8i.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

conversation_history: Dict[Tuple[str, str], List] = {}

conversation_flights: Dict[
    Tuple[str, str],
    Dict[str, Any],
] = {}

pending_selections: Dict[
    Tuple[str, str],
    Dict[str, Any],
] = {}


class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    selected_flight: Dict[str, Any] | None = None
    checkout_payload: Dict[str, Any] | None = None


def extract_text(content: Any) -> str:
    """Normalize text and block-based model responses."""
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "\n".join(
            block["text"]
            for block in content
            if isinstance(block, dict)
            and block.get("type") == "text"
        )

    return str(content or "")


def is_confirmation(message: str) -> bool:
    """Recognize explicit positive confirmation phrases."""
    normalized = message.strip().lower()

    return normalized in {
        "yes",
        "yes please",
        "confirm",
        "confirm it",
        "continue",
        "continue booking",
        "proceed",
        "proceed booking",
        "go ahead",
        "book it",
        "continue to checkout",
    }


def is_decline(message: str) -> bool:
    """Recognize explicit cancellation phrases."""
    normalized = message.strip().lower()

    return normalized in {
        "no",
        "no thanks",
        "cancel",
        "don't book",
        "do not book",
        "stop",
        "not now",
    }


def extract_option_number(message: str) -> int | None:
    """
    Extract an explicitly numbered flight choice.

    Examples:
    'flight 2', 'option 2', 'number 2', or simply '2'.
    """
    normalized = message.strip().lower()

    if normalized.isdigit():
        return int(normalized)

    match = re.search(
        r"\b(?:flight|option|number|no\.?)\s*#?\s*(\d+)\b",
        normalized,
    )

    if match:
        return int(match.group(1))

    return None


def get_airport_code(value: Any) -> str:
    if isinstance(value, str):
        return value

    if isinstance(value, dict):
        return value.get("iata_code") or value.get("name") or ""

    return ""


def build_checkout_payload(
    flight: Dict[str, Any],
    search_context: Dict[str, Any],
) -> Dict[str, Any] | None:
    """
    Construct the existing frontend checkout structure from actual
    stored flight and search data. Do not guess missing route/date data.
    """
    slices = flight.get("slices") or []

    origin = search_context.get("origin")
    destination = search_context.get("destination")
    departure_date = search_context.get("departure_date")

    if not origin and slices:
        origin = slices[0].get("origin")

    if not destination and slices:
        destination = slices[0].get("destination")

    if not origin or not destination or not departure_date:
        return None

    passengers = search_context.get("passengers", 1)

    try:
        passenger_count = int(passengers)
    except (TypeError, ValueError):
        return None

    if passenger_count < 1:
        return None

    return {
        "flight": flight,
        "origin": get_airport_code(origin).upper(),
        "destination": get_airport_code(destination).upper(),
        "originCity": search_context.get("origin_city")
        or get_airport_code(origin).upper(),
        "destinationCity": search_context.get("destination_city")
        or get_airport_code(destination).upper(),
        "departureDate": departure_date,
        "returnDate": search_context.get("return_date") or "",
        "passengers": str(passenger_count),
    }


@app.get("/")
def home():
    return {"message": "TripPilot AI is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    start_time = time.time()
    conversation_id = request.conversation_id
    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    try:
        access_token = (
            credentials.credentials if credentials else None
        )

        print("JWT received:", bool(access_token))

        token_scope = (
            hashlib.sha256(access_token.encode()).hexdigest()
            if access_token
            else "anonymous"
        )

        history_key = (token_scope, conversation_id)

        # Handle an existing pending selection before asking the agent
        # to interpret the confirmation message.
        pending = pending_selections.get(history_key)

        if pending:
            if is_decline(user_message):
                pending_selections.pop(history_key, None)

                return ChatResponse(
                    answer="No problem. I haven't started checkout. "
                    "You can choose another flight whenever you're ready.",
                    conversation_id=conversation_id,
                )

            if is_confirmation(user_message):
                flight = pending["flight"]
                search_context = pending["search_context"]

                checkout_payload = build_checkout_payload(
                    flight,
                    search_context,
                )

                if not checkout_payload:
                    pending_selections.pop(history_key, None)

                    return ChatResponse(
                        answer=(
                            "I couldn't prepare checkout because some "
                            "route or date details are missing. "
                            "Please search for the flight again."
                        ),
                        conversation_id=conversation_id,
                    )

                pending_selections.pop(history_key, None)

                return ChatResponse(
                    answer=(
                        "Your flight selection is confirmed. "
                        "Review the itinerary and passenger details "
                        "before continuing to simulated payment."
                    ),
                    conversation_id=conversation_id,
                    selected_flight=flight,
                    checkout_payload=checkout_payload,
                )

            # A different message cancels the pending confirmation
            # and is handled as a new chat request.
            pending_selections.pop(history_key, None)

        # If actual search results exist, handle explicit numbered choice.
        search_context = conversation_flights.get(history_key)

        if search_context:
            option_number = extract_option_number(user_message)
            flights = search_context.get("flights", [])

            if option_number is not None:
                if option_number < 1 or option_number > len(flights):
                    return ChatResponse(
                        answer=(
                            f"Please choose a flight number between 1 "
                            f"and {len(flights)}."
                        ),
                        conversation_id=conversation_id,
                    )

                selected = flights[option_number - 1]

                if not selected.get("id"):
                    return ChatResponse(
                        answer=(
                            "That offer is missing its provider ID. "
                            "Please search again."
                        ),
                        conversation_id=conversation_id,
                    )

                pending_selections[history_key] = {
                    "flight": selected,
                    "search_context": search_context,
                }

                price = selected.get("price")
                currency = selected.get("currency") or ""

                return ChatResponse(
                    answer=(
                        f"You selected flight {option_number} "
                        f"({selected.get('id')}). "
                        f"Displayed price: {price} {currency}. "
                        "Would you like to continue to booking review? "
                        "Reply yes to confirm or no to cancel."
                    ),
                    conversation_id=conversation_id,
                )

        # Normal AI conversation and tool execution.
        messages = conversation_history.get(
            history_key, []
        ).copy()

        messages.append(HumanMessage(content=user_message))

        agent = build_agent(access_token)

        response = agent.invoke(
            {"messages": messages},
            config={"recursion_limit": 10},
        )

        conversation_history[history_key] = response["messages"]

        # Capture real results from search_flights tool messages.
        for agent_message in response["messages"]:
            if getattr(agent_message, "type", None) != "tool":
                continue

            if getattr(agent_message, "name", "") != "search_flights":
                continue

            content = getattr(agent_message, "content", None)

            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except (ValueError, TypeError):
                    continue

            if not isinstance(content, dict):
                continue

            if content.get("success") is not True:
                continue

            flights = content.get("flights", [])

            if isinstance(flights, list) and flights:
                # The current search tool must supply search details
                # for a complete checkout payload.
                conversation_flights[history_key] = {
                    "request_id": content.get("request_id"),
                    "trip_type": content.get("trip_type"),
                    "passengers": content.get("passengers", 1),
                    "origin": content.get("origin"),
                    "destination": content.get("destination"),
                    "origin_city": content.get("origin_city"),
                    "destination_city": content.get("destination_city"),
                    "departure_date": content.get("departure_date"),
                    "return_date": content.get("return_date"),
                    "flights": flights,
                }

        answer = extract_text(
            response["messages"][-1].content
        )

        print(
            f"Agent finished in "
            f"{time.time() - start_time:.2f}s"
        )

        return ChatResponse(
            answer=answer,
            conversation_id=conversation_id,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Agent failed after "
            f"{time.time() - start_time:.2f}s: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="AI request failed. Check the AI service terminal.",
        )
