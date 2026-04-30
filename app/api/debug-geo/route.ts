import { NextResponse } from "next/server";

const STEAM_COUNTRY_CODE = "US";

const SUPPORTED_STEAM_COUNTRIES = new Set([
  "AR", "AU", "AT", "BE", "BR", "BG", "CA", "CL", "CN", "CO", "CR", "HR",
  "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HK", "HU", "IS", "IN",
  "ID", "IE", "IL", "IT", "JP", "KZ", "KR", "KW", "LV", "LT", "LU", "MY",
  "MT", "MX", "ME", "NL", "NZ", "NO", "PE", "PH", "PL", "PT", "QA", "RO",
  "SA", "RS", "SG", "SK", "SI", "ZA", "ES", "SE", "CH", "TW", "TH", "TR",
  "UA", "AE", "GB", "US", "UY", "VN",
]);

const GEO_HEADER_NAMES = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "cloudfront-viewer-country",
  "x-nf-country",
  "x-netlify-country",
  "accept-language",
];

function getCountryFromAcceptLanguage(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return null;
  }

  for (const locale of acceptLanguage.split(",")) {
    const regionMatch = locale.trim().match(/-(\w{2})\b/);

    if (!regionMatch) {
      continue;
    }

    const countryCode = regionMatch[1].toUpperCase();

    if (SUPPORTED_STEAM_COUNTRIES.has(countryCode)) {
      return countryCode;
    }
  }

  return null;
}

function getDetectedCountryCode(request: Request) {
  const headerCandidates = [
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
    request.headers.get("x-country-code"),
    request.headers.get("cloudfront-viewer-country"),
    request.headers.get("x-nf-country"),
    request.headers.get("x-netlify-country"),
  ];

  for (const headerValue of headerCandidates) {
    const countryCode = headerValue?.toUpperCase();

    if (countryCode && SUPPORTED_STEAM_COUNTRIES.has(countryCode)) {
      return countryCode;
    }
  }

  return getCountryFromAcceptLanguage(request.headers.get("accept-language")) ?? STEAM_COUNTRY_CODE;
}

export async function GET(request: Request) {
  const headers = Object.fromEntries(
    GEO_HEADER_NAMES.map((headerName) => [
      headerName,
      request.headers.get(headerName),
    ]),
  );

  return NextResponse.json({
    detectedCountryCode: getDetectedCountryCode(request),
    headers,
  });
}
