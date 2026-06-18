export type ApiRequest<TQuery> = {
    method?: string;
    query: TQuery;
};
export type ApiResponse = {
    status: (statusCode: number) => ApiResponse;
    json: (body: unknown) => void;
    setHeader: (name: string, value: string) => void;
};
