type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default function handler(_request: unknown, response: ApiResponse) {
  response.status(200).json({ message: "Serverless API is running" });
}
