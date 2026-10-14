const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://trippilot-backend-ytpv.onrender.com";

// Login response returned by the backend
export type AuthResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

// Booking response returned by the backend
export type BookingResponse = {
  id: string;
  userId: string;
  flightId: string;
  status: string;
  passengerCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FlightSearchPayload = {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
  returnDate?: string;
};

// Common function for sending requests to the NestJS backend
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || data.error || "Something went wrong.";

    throw new Error(message);
  }

  return data as T;
}

// Register a new user
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<unknown> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

// Login an existing user
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const token = data.access_token || data.accessToken || data.token;

  if (!token) {
    throw new Error(
      "No JWT token returned. Check the backend login response.",
    );
  }

  // Store the token for the current browser session
  if (typeof window !== "undefined") {
    sessionStorage.setItem("trippilot_token", token);
  }

  return data;
}

// Read the saved login token
export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem("trippilot_token");
}

export function requireAuthPath(nextPath: string) {
  if (getToken()) return nextPath;
  const safeNext = nextPath.startsWith("/") ? nextPath : "/";
  return `/login?next=${encodeURIComponent(safeNext)}`;
}

// Logout the current user
export function logout(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("trippilot_token");
  }
}

// Send authenticated requests to protected NestJS APIs
export async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  return request<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function searchFlights(payload: FlightSearchPayload): Promise<unknown> {
  return request<unknown>("/flights/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Create a demo booking in the backend database
export async function createBooking(
  flightId: string,
  passengerCount: number,
): Promise<BookingResponse> {
  return authenticatedRequest<BookingResponse>("/bookings", {
    method: "POST",
    body: JSON.stringify({
      flightId,
      passengerCount,
    }),
  });
}

export async function getBooking(id: string): Promise<BookingResponse> {
  return authenticatedRequest<BookingResponse>(
    `/bookings/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}
