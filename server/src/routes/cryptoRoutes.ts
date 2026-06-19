import { Router } from "express";
import { parseCryptoIds } from "../../../shared/contracts/crypto.ts";
import { DASHBOARD_CACHE_CONTROL } from "../../../shared/http/cache.ts";
import { getCryptoApiError } from "../../../shared/services/cryptoService.ts";
import { getCryptoPrices } from "../services/cryptoService.js";

const router = Router();

router.get("/", async (req, res) => {
  const queryIds = Array.isArray(req.query.ids) ? req.query.ids[0] : req.query.ids;
  const ids = parseCryptoIds(typeof queryIds === "string" ? queryIds : undefined);

  if (!ids) {
    res.status(400).json({ message: "Please select one to five supported crypto assets." });
    return;
  }

  try {
    const assets = await getCryptoPrices(ids);
    res.setHeader("Cache-Control", DASHBOARD_CACHE_CONTROL);
    res.json({ assets });
  } catch (error) {
    const apiError = getCryptoApiError(error);
    console.error("Crypto request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

export default router;
