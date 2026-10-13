
from langchain.tools import tool

from rag.rag_chain import answer_travel_question


@tool
def search_travel_knowledge(question: str) -> str:
    """
    Search TripPilot AI's travel knowledge base.

    Use this tool for baggage allowance, travel documents,
    check-in, flight changes, cancellation, refunds, and
    general travel FAQs.

    Do not use this tool to search live flights or create bookings.
    """
    return answer_travel_question(question)
