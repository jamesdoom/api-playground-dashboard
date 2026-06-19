import { parseCryptoIds } from "../shared/runtime/contracts/crypto.js";
import { DASHBOARD_CACHE_CONTROL } from "../shared/runtime/http/cache.js";
import type { ApiRequest, ApiResponse } from "../shared/http/serverless.ts";
import {
  getCryptoApiError,
  getCryptoPrices,
} from "../shared/runtime/services/cryptoService.js";

type CryptoQuery = {
  ids?: string | string[];
};

export default async function handler(request: ApiRequest<CryptoQuery>, response: ApiResponse) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const queryIds = Array.isArray(request.query.ids) ? request.query.ids[0] : request.query.ids;
  const ids = parseCryptoIds(queryIds);

  if (!ids) {
    response.status(400).json({ message: "Please select one to five supported crypto assets." });
    return;
  }

  try {
    const assets = await getCryptoPrices(process.env.COINGECKO_API_KEY, ids);
    response.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    response.status(200).json({ assets });
  } catch (error) {
    const apiError = getCryptoApiError(error);
    console.error("Crypto request failed:", error);
    response.status(apiError.statusCode).json({ message: apiError.message });
  }
}
