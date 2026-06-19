import { type CoinGeckoMarketChartResponse, type CoinGeckoSimplePriceResponse, type CryptoAsset, type CryptoHistoryResponse, type CryptoId } from "../contracts/crypto.ts";
import { type ApiErrorDetails } from "../errors/ProviderError.ts";
export declare function mapCoinGeckoResponse(data: CoinGeckoSimplePriceResponse, ids?: readonly CryptoId[]): CryptoAsset[];
export declare function getCryptoPrices(apiKey: string | undefined, ids?: readonly CryptoId[]): Promise<CryptoAsset[]>;
export declare function mapCoinGeckoHistory(id: CryptoId, data: CoinGeckoMarketChartResponse): CryptoHistoryResponse;
export declare function getCryptoHistory(apiKey: string | undefined, id: CryptoId): Promise<CryptoHistoryResponse>;
export declare function getCryptoApiError(error: unknown): ApiErrorDetails;
