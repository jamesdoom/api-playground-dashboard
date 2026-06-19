import { getCryptoPrices as fetchCryptoPrices } from "../../../shared/services/cryptoService.ts";
import type { CryptoId } from "../../../shared/contracts/crypto.ts";

export function getCryptoPrices(ids: readonly CryptoId[]) {
  return fetchCryptoPrices(process.env.COINGECKO_API_KEY, ids);
}
