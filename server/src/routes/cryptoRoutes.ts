import { Router } from "express";
import { DASHBOARD_CACHE_CONTROL } from "../../../shared/http/cache.ts";
import { getCryptoApiError } from "../../../shared/services/cryptoService.ts";
import { getCryptoPrices } from "../services/cryptoService.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const assets = await getCryptoPrices();
    res.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    res.json({ assets });
  } catch (error) {
    const apiError = getCryptoApiError(error);
    console.error("Crypto request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

export default router;
