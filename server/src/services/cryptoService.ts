import {
  getCryptoHistory as fetchCryptoHistory,
  getCryptoPrices as fetchCryptoPrices,
} from "../../../shared/services/cryptoService.ts";
import type { CryptoHistoryDays, CryptoId } from "../../../shared/contracts/crypto.ts";

export function getCryptoPrices(ids: readonly CryptoId[]) {
  return fetchCryptoPrices(process.env.COINGECKO_API_KEY, ids);
}

export function getCryptoHistory(id: CryptoId, days: CryptoHistoryDays) {
  return fetchCryptoHistory(process.env.COINGECKO_API_KEY, id, days);
}
