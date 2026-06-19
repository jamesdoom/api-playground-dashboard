import { Router } from "express";
import { isCryptoId, parseCryptoIds } from "../../../shared/contracts/crypto.ts";
import {
  DASHBOARD_CACHE_CONTROL,
  HISTORICAL_PRICE_CACHE_CONTROL,
} from "../../../shared/http/cache.ts";
import { getCryptoApiError } from "../../../shared/services/cryptoService.ts";
import { getCryptoHistory, getCryptoPrices } from "../services/cryptoService.js";

const router = Router();

router.get("/history", async (req, res) => {
  const queryId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = typeof queryId === "string" ? queryId.trim().toLowerCase() : "";

  if (!isCryptoId(id)) {
    res.status(400).json({ message: "Please select a supported crypto asset." });
    return;
  }

  try {
    const history = await getCryptoHistory(id);
    res.setHeader("Cache-Control", HISTORICAL_PRICE_CACHE_CONTROL);
    res.json(history);
  } catch (error) {
    const apiError = getCryptoApiError(error);
    console.error("Crypto history request failed:", error);
    res.status(apiError.statusCode).json({ message: apiError.message });
  }
});

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
