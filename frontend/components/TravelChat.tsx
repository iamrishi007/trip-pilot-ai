
"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import {
  saveCheckout,
  type CheckoutPayload,
} from "@/lib/checkout";

const AI_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://127.0.0.1:8000";

const suggestions = [
  "Find the cheapest flight from Delhi to Mumbai.",
  "Suggest some amazing destinations for my next trip.",
  "Help me plan a trip within my budget.",
  "What should I pack for a 5-day city break?",
  "Show me my recent bookings.",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SelectedFlight = {
  id: string;
  price?: string | number;
  currency?: string;
  original_price?: string | number;
  original_currency?: string;
  live_mode?: boolean;
  slices?: {
    type?: string;
    origin?: string;
    destination?: string;
    segments?: {
      airline?: string;
      flight_number?: string;
      origin?: string;
      destination?: string;
      departure?: string;
      arrival?: string;
    }[];
  }[];
};

type ChatResponse = {
  answer?: string;
  conversation_id?: string;
  selected_flight?: SelectedFlight | null;
  checkout_payload?: CheckoutPayload | null;
  detail?: string | { msg?: string }[];
  message?: string | string[];
};

function cleanAIResponse(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/(?<!\*)\*(?!\s)(.*?)(?<!\s)\*(?!\*)/gs, "$1")
    .replace(/(?<!_)_(?!\s)(.*?)(?<!\s)_(?!_)/gs, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function TravelChat() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState("");

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setConversationId(`trip-pilot-${Date.now()}`);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function requireLogin(): boolean {
    if (getToken()) {
      return true;
    }

    setError(
      "Please log in to use the AI Travel Assistant. Redirecting you to login...",
    );

    window.setTimeout(() => {
      router.push("/login");
    }, 800);

    return false;
  }

  // Save a complete, validated checkout payload before navigation.
  function continueToCheckout(payload: CheckoutPayload) {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    if (
      !payload.flight?.id ||
      !payload.origin ||
      !payload.destination ||
      !payload.departureDate
    ) {
      setError(
        "The selected flight is missing required details. Please search again.",
      );
      return;
    }

    const passengerCount = Number(payload.passengers);

    if (
      !Number.isInteger(passengerCount) ||
      passengerCount < 1
    ) {
      setError("Please provide a valid passenger count.");
      return;
    }

    saveCheckout(payload);
    router.push("/bookings/review");
  }

  async function sendPrompt(text: string) {
    if (!text || loading || !conversationId) {
      return;
    }

    if (!requireLogin()) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      { role: "user", content: text },
    ]);

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const token = getToken();

      if (!token) {
        setMessages((previous) => previous.slice(0, -1));
        setError("Please log in to use the AI Travel Assistant.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${AI_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      });

      const data: ChatResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status}`;

        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((item) => item.msg || "Invalid request")
            .join(", ");
        } else if (Array.isArray(data.message)) {
          errorMessage = data.message.join(", ");
        } else if (typeof data.message === "string") {
          errorMessage = data.message;
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setError("Your session has expired. Please log in again.");
          router.push("/login");
          return;
        }

        throw new Error(errorMessage);
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: cleanAIResponse(
            data.answer || "No response was returned.",
          ),
        },
      ]);

      /*
       * Checkout starts only when the AI service supplies a complete
       * checkout payload created from a validated flight selection.
       *
       * selected_flight alone is insufficient because the review page
       * also requires route, dates, city names, and passenger count.
       */
      if (data.checkout_payload && data.selected_flight) {
        const payload = data.checkout_payload;

        // Ensure the checkout payload refers to the selected offer.
        if (payload.flight?.id !== data.selected_flight.id) {
          setError(
            "The selected flight details could not be verified. Please search again.",
          );
          return;
        }

        continueToCheckout(payload);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to TripPilot AI.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendPrompt(message.trim());
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function startNewChat() {
    if (!requireLogin()) {
      return;
    }

    setMessages([]);
    setMessage("");
    setError("");
    setConversationId(`trip-pilot-${Date.now()}`);
  }

  return (
    <section id="assistant" className="chat-panel">
      <div className="section-heading">
        <p className="eyebrow">AI travel assistant</p>

        <div className="heading-row">
          <h2>Ask TripPilot anything</h2>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={startNewChat}
          >
            New chat
          </button>
        </div>

        <p className="lede">
          Flight ideas, itinerary help, and travel FAQs — powered by your
          TripPilot AI service.
        </p>
      </div>

      <div className="suggestion-row">
        {suggestions.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="chip-button"
            onClick={() => void sendPrompt(prompt)}
            disabled={loading || !conversationId}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div
        className="conversation"
        ref={scrollerRef}
        aria-live="polite"
      >
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <p>
              Start with a destination, a budget, or a question about travel
              rules.
            </p>
          </div>
        )}

        {messages.map((item, index) => (
          <div
            className={`chat-message ${item.role}`}
            key={`${conversationId}-${index}`}
          >
            <div className="chat-avatar" aria-hidden="true">
              {item.role === "user" ? "You" : "AI"}
            </div>

            <div className="chat-message-body">
              <p className="message-label">
                {item.role === "user" ? "You" : "TripPilot AI"}
              </p>

              <p className="message-content">{item.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="loading-message" role="status">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
            TripPilot is thinking...
          </div>
        )}

        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your next trip..."
          rows={2}
          aria-label="Message TripPilot AI"
        />

        <button
          className="btn btn-primary"
          type="submit"
          disabled={
            !message.trim() ||
            loading ||
            !conversationId
          }
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>

      <p className="disclaimer">
        TripPilot AI can make mistakes. Demo bookings are not real airline
        tickets.
      </p>
    </section>
  );
}
