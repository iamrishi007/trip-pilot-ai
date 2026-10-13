
import os
import requests
from dotenv import load_dotenv
from langchain.tools import tool

load_dotenv()


def get_booking_tool(access_token: str | None = None):
    """Create a booking tool for the current authenticated user."""

    @tool
    def create_demo_booking(
        flight_id: str,
        passenger_count: int = 1,
    ) -> dict:
        """Create a demo booking record for a selected flight.
        Requires the user's JWT token.
        This does not purchase an airline ticket.
        """

        if not access_token:
            raise ValueError(
                "Please log in before creating a booking."
            )

        backend_url = os.getenv(
            "BACKEND_URL",
            "http://localhost:3000",
        )

        payload = {
            "flightId": flight_id,
            "passengerCount": passenger_count,
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
        }

        response = requests.post(
            f"{backend_url}/bookings",
            json=payload,
            headers=headers,
            timeout=30,
        )

        response.raise_for_status()
        return response.json()

    return create_demo_booking
