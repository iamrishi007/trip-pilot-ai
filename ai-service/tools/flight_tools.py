
import os
import requests
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()


@tool
def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str | None = None,
    passengers: int = 1,
) -> dict:
    """
    Search live flights and return real offer IDs, flight details,
    prices, and the original search information.
    Prefer INR when the backend supplies a converted INR price.
    """

    backend_url = os.getenv(
        "BACKEND_URL",
        "http://localhost:3000",
    ).rstrip("/")

    payload = {
        "origin": origin,
        "destination": destination,
        "departureDate": departure_date,
        "passengers": passengers,
    }

    if return_date:
        payload["returnDate"] = return_date

    print("Flight search payload:", payload)

    # Step 1: Request live offers from the NestJS backend.
    try:
        response = requests.post(
            f"{backend_url}/flights/search",
            json=payload,
            timeout=30,
        )
    except requests.RequestException as error:
        print("Flight search request failed:", str(error))

        return {
            "success": False,
            "message": (
                "I couldn't connect to the flight search service. "
                "Please try again shortly."
            ),
        }

    # Step 2: Handle backend errors.
    if not response.ok:
        print("Backend status:", response.status_code)
        print("Backend error response:", response.text)

        try:
            error_data = response.json()

            message = error_data.get(
                "message",
                "Please check your flight search details.",
            )

            if isinstance(message, list):
                message = " ".join(str(item) for item in message)

        except ValueError:
            message = "Please check your flight search details."

        if response.status_code == 400:
            return {
                "success": False,
                "message": str(message),
            }

        if response.status_code in (401, 403):
            return {
                "success": False,
                "message": (
                    "Your request could not be authorized. "
                    "Please log in again and retry."
                ),
            }

        if response.status_code == 429:
            return {
                "success": False,
                "message": (
                    "Flight search is temporarily rate-limited. "
                    "Please try again shortly."
                ),
            }

        return {
            "success": False,
            "message": (
                "The flight search service encountered a problem. "
                "Please try again later."
            ),
        }

    # Step 3: Parse the backend response.
    try:
        data = response.json()
    except ValueError:
        return {
            "success": False,
            "message": (
                "The flight service returned an invalid response."
            ),
        }

    offers = data.get("offers", [])

    if not isinstance(offers, list) or not offers:
        return {
            "success": False,
            "message": (
                "No flights were found for those details. "
                "Try different dates or another route."
            ),
        }

    normalized_flights = []

    # Keep up to five offers for the AI to present.
    for offer in offers[:5]:
        if not isinstance(offer, dict):
            continue

        offer_id = offer.get("id")

        # A real provider offer ID is required for checkout.
        if not offer_id:
            continue

        formatted_slices = []

        for index, flight_slice in enumerate(
            offer.get("slices", [])
        ):
            segments = []

            for segment in flight_slice.get("segments", []):
                carrier = (
                    segment.get("operating_carrier")
                    or segment.get("marketing_carrier")
                    or {}
                )

                origin_data = segment.get("origin") or {}
                destination_data = segment.get("destination") or {}

                segments.append({
                    "airline": carrier.get("name"),
                    "flight_number": (
                        segment.get(
                            "operating_carrier_flight_number"
                        )
                        or segment.get(
                            "marketing_carrier_flight_number"
                        )
                    ),
                    "origin": origin_data.get("iata_code"),
                    "destination": destination_data.get("iata_code"),
                    "departure": segment.get("departing_at"),
                    "arrival": segment.get("arriving_at"),
                })

            slice_origin = flight_slice.get("origin") or {}
            slice_destination = flight_slice.get("destination") or {}

            formatted_slices.append({
                "type": "outbound" if index == 0 else "return",
                "origin": slice_origin.get("iata_code"),
                "destination": slice_destination.get("iata_code"),
                "segments": segments,
            })

        # Step 4: Preserve the original provider price.
        original_price = offer.get(
            "original_price",
            offer.get("total_amount"),
        )

        original_currency = offer.get(
            "original_currency",
            offer.get("total_currency"),
        )

        # Step 5: Display INR only when an actual INR conversion exists.
        inr_price = offer.get("price_inr")
        inr_currency = offer.get("currency_inr")

        if inr_price is not None and inr_currency == "INR":
            display_price = inr_price
            display_currency = "INR"
        else:
            display_price = original_price
            display_currency = original_currency

        normalized_flights.append({
            "id": offer_id,
            "price": display_price,
            "currency": display_currency,
            "original_price": original_price,
            "original_currency": original_currency,
            "live_mode": offer.get("live_mode"),
            "slices": formatted_slices,
        })

    if not normalized_flights:
        return {
            "success": False,
            "message": (
                "The flight service returned no usable offers. "
                "Please search again."
            ),
        }

    # Step 6: Return offers and the search details needed for checkout.
    result = {
        "success": True,
        "request_id": data.get("id"),
        "trip_type": "round-trip" if return_date else "one-way",

        # Preserve the user's original search details.
        "origin": origin.upper(),
        "destination": destination.upper(),
        "departure_date": departure_date,
        "return_date": return_date or "",
        "passengers": passengers,

        # Real offers returned by the backend.
        "flights": normalized_flights,
    }

    print("NORMALIZED FLIGHT RESULTS:", result)

    return result
