import type { BookingResponse } from "@/lib/api";
import type { Flight } from "@/lib/flights";

const CHECKOUT_KEY = "trippilot_checkout";
const CONFIRMATION_KEY = "trippilot_confirmation";

export type CheckoutPayload = {
  flight: Flight;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  departureDate: string;
  returnDate: string;
  passengers: string;
};

export type ConfirmationPayload = {
  booking: BookingResponse;
  checkout: CheckoutPayload;
  paymentMethod: "card" | "upi" | "wallet";
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveCheckout(payload: CheckoutPayload) {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(payload));
}

export function getCheckout(): CheckoutPayload | null {
  const payload = readJson<CheckoutPayload>(CHECKOUT_KEY);
  if (!payload?.flight?.id) return null;
  return payload;
}

export function clearCheckout() {
  sessionStorage.removeItem(CHECKOUT_KEY);
}

export function saveConfirmation(payload: ConfirmationPayload) {
  sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(payload));
}

export function getConfirmation(): ConfirmationPayload | null {
  const payload = readJson<ConfirmationPayload>(CONFIRMATION_KEY);
  if (!payload?.booking?.id) return null;
  return payload;
}
