import { getCryptoPrices as fetchCryptoPrices } from "../../../shared/services/cryptoService.ts";

export function getCryptoPrices() {
  return fetchCryptoPrices(process.env.COINGECKO_API_KEY);
}
