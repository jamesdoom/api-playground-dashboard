import type { ApiResponse } from "../shared/http/serverless.ts";

export default function handler(_request: unknown, response: ApiResponse) {
  response.status(200).json({ message: "Serverless API is running" });
}
