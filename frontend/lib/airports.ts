export type AirportOption = {
  city: string;
  code: string;
  airport: string;
  country: string;
  aliases: string[];
};

export const AIRPORTS: AirportOption[] = [
  {
    city: "Mumbai",
    code: "BOM",
    airport: "Chhatrapati Shivaji Maharaj International Airport",
    country: "India",
    aliases: ["Bombay", "MUM"],
  },
  {
    city: "Delhi",
    code: "DEL",
    airport: "Indira Gandhi International Airport",
    country: "India",
    aliases: ["New Delhi", "NCR"],
  },
  {
    city: "Bengaluru",
    code: "BLR",
    airport: "Kempegowda International Airport",
    country: "India",
    aliases: ["Bangalore"],
  },
  {
    city: "Hyderabad",
    code: "HYD",
    airport: "Rajiv Gandhi International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Chennai",
    code: "MAA",
    airport: "Chennai International Airport",
    country: "India",
    aliases: ["Madras"],
  },
  {
    city: "Kolkata",
    code: "CCU",
    airport: "Netaji Subhas Chandra Bose International Airport",
    country: "India",
    aliases: ["Calcutta"],
  },
  {
    city: "Pune",
    code: "PNQ",
    airport: "Pune Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Ahmedabad",
    code: "AMD",
    airport: "Sardar Vallabhbhai Patel International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Goa",
    code: "GOI",
    airport: "Goa International Airport, Dabolim",
    country: "India",
    aliases: ["Dabolim"],
  },
  {
    city: "Goa",
    code: "GOX",
    airport: "Manohar International Airport, Mopa",
    country: "India",
    aliases: ["Mopa"],
  },
  {
    city: "Kochi",
    code: "COK",
    airport: "Cochin International Airport",
    country: "India",
    aliases: ["Cochin"],
  },
  {
    city: "Jaipur",
    code: "JAI",
    airport: "Jaipur International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Lucknow",
    code: "LKO",
    airport: "Chaudhary Charan Singh International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Chandigarh",
    code: "IXC",
    airport: "Shaheed Bhagat Singh International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Nagpur",
    code: "NAG",
    airport: "Dr. Babasaheb Ambedkar International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Nashik",
    code: "ISK",
    airport: "Nashik Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Thiruvananthapuram",
    code: "TRV",
    airport: "Trivandrum International Airport",
    country: "India",
    aliases: ["Trivandrum"],
  },
  {
    city: "Guwahati",
    code: "GAU",
    airport: "Lokpriya Gopinath Bordoloi International Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Indore",
    code: "IDR",
    airport: "Devi Ahilya Bai Holkar Airport",
    country: "India",
    aliases: [],
  },
  {
    city: "Dubai",
    code: "DXB",
    airport: "Dubai International Airport",
    country: "UAE",
    aliases: [],
  },
  {
    city: "Abu Dhabi",
    code: "AUH",
    airport: "Zayed International Airport",
    country: "UAE",
    aliases: [],
  },
  {
    city: "Singapore",
    code: "SIN",
    airport: "Singapore Changi Airport",
    country: "Singapore",
    aliases: [],
  },
  {
    city: "London",
    code: "LHR",
    airport: "Heathrow Airport",
    country: "United Kingdom",
    aliases: ["Heathrow"],
  },
  {
    city: "London",
    code: "LGW",
    airport: "Gatwick Airport",
    country: "United Kingdom",
    aliases: ["Gatwick"],
  },
  {
    city: "New York",
    code: "JFK",
    airport: "John F. Kennedy International Airport",
    country: "United States",
    aliases: ["NYC", "Kennedy"],
  },
  {
    city: "New York",
    code: "EWR",
    airport: "Newark Liberty International Airport",
    country: "United States",
    aliases: ["Newark"],
  },
  {
    city: "Paris",
    code: "CDG",
    airport: "Charles de Gaulle Airport",
    country: "France",
    aliases: [],
  },
  {
    city: "Tokyo",
    code: "HND",
    airport: "Haneda Airport",
    country: "Japan",
    aliases: ["Haneda"],
  },
  {
    city: "Tokyo",
    code: "NRT",
    airport: "Narita International Airport",
    country: "Japan",
    aliases: ["Narita"],
  },
  {
    city: "Bangkok",
    code: "BKK",
    airport: "Suvarnabhumi Airport",
    country: "Thailand",
    aliases: [],
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function airportLabel(airport: AirportOption) {
  return `${airport.city} (${airport.code})`;
}

export function findAirport(value?: string): AirportOption | undefined {
  if (!value) return undefined;

  const normalized = normalize(value);
  const exactCode = AIRPORTS.find(
    (airport) => normalize(airport.code) === normalized,
  );
  if (exactCode) return exactCode;

  const labeled = AIRPORTS.find(
    (airport) => normalize(airportLabel(airport)) === normalized,
  );
  if (labeled) return labeled;

  return AIRPORTS.find(
    (airport) =>
      normalize(airport.city) === normalized ||
      normalize(airport.airport) === normalized ||
      airport.aliases.some((alias) => normalize(alias) === normalized),
  );
}

export function suggestAirports(query: string, limit = 8): AirportOption[] {
  const normalized = normalize(query);

  if (!normalized) {
    return AIRPORTS.slice(0, limit);
  }

  const scored = AIRPORTS.map((airport) => {
    const haystack = [
      airport.city,
      airport.code,
      airport.airport,
      airport.country,
      ...airport.aliases,
      airportLabel(airport),
    ]
      .map(normalize)
      .join(" ");

    let score = 0;
    if (normalize(airport.code) === normalized) score += 100;
    if (normalize(airport.city) === normalized) score += 80;
    if (normalize(airport.code).startsWith(normalized)) score += 60;
    if (normalize(airport.city).startsWith(normalized)) score += 50;
    if (haystack.includes(normalized)) score += 20;

    return { airport, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.airport.city.localeCompare(b.airport.city));

  return scored.slice(0, limit).map((item) => item.airport);
}

export function cityFromCode(code?: string, fallback = "") {
  return findAirport(code)?.city ?? fallback;
}
