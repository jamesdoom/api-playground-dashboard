import { isCryptoId } from "../../shared/runtime/contracts/crypto.js";
import { HISTORICAL_PRICE_CACHE_CONTROL } from "../../shared/runtime/http/cache.js";
import type { ApiRequest, ApiResponse } from "../../shared/http/serverless.ts";
import {
  getCryptoApiError,
  getCryptoHistory,
} from "../../shared/runtime/services/cryptoService.js";

type CryptoHistoryQuery = {
  id?: string | string[];
};

export default async function handler(
  request: ApiRequest<CryptoHistoryQuery>,
  response: ApiResponse,
) {
  if (request.method && request.method !== "GET") {
    response.status(405).json({ message: "This endpoint only supports GET requests." });
    return;
  }

  const queryId = Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
  const id = queryId?.trim().toLowerCase();

  if (!id || !isCryptoId(id)) {
    response.status(400).json({ message: "Please select a supported crypto asset." });
    return;
  }

  try {
    const history = await getCryptoHistory(process.env.COINGECKO_API_KEY, id);
    response.setHeader("Cache-Control", HISTORICAL_PRICE_CACHE_CONTROL);
    response.status(200).json(history);
  } catch (error) {
    const apiError = getCryptoApiError(error);
    console.error("Crypto history request failed:", error);
    response.status(apiError.statusCode).json({ message: apiError.message });
  }
}
