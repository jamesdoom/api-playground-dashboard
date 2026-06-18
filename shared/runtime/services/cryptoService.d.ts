import { type CoinGeckoSimplePriceResponse, type CryptoAsset } from "../contracts/crypto.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapCoinGeckoResponse(data: CoinGeckoSimplePriceResponse): CryptoAsset[];
export declare function getCryptoPrices(apiKey: string | undefined): Promise<CryptoAsset[]>;
export declare function getCryptoApiError(error: unknown): ApiErrorDetails;
