import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewsWidget from "./NewsWidget";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const newsResponse = {
  articles: [
    {
      id: "technology/example",
      title: "Example technology headline",
      section: "Technology",
      publishedAt: "2026-06-18T12:00:00Z",
      url: "https://www.theguardian.com/example",
      thumbnail: null,
    },
  ],
};

describe("NewsWidget", () => {
  it("shows loading and success states", async () => {
    let resolveRequest!: (response: Response) => void;
    const request = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(request));

    render(<NewsWidget />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading current headlines");

    await act(async () => {
      resolveRequest(jsonResponse(newsResponse));
    });

    expect(
      await screen.findByRole("link", { name: /Example technology headline/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Updated /)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });

  it("persists category changes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(newsResponse));
    vi.stubGlobal("fetch", fetchMock);

    render(<NewsWidget />);
    await screen.findByRole("link", { name: /Example technology headline/ });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "technology" } });

    expect(window.localStorage.getItem("dashboard-news-category")).toBe("technology");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/news?category=technology",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("shows the API error and a retry action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Headlines are unavailable right now." }, 500)),
    );

    render(<NewsWidget />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Headlines are unavailable right now.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("replaces a broken article thumbnail with its section fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          articles: [{ ...newsResponse.articles[0], thumbnail: "https://example.com/broken.jpg" }],
        }),
      ),
    );

    const { container } = render(<NewsWidget />);
    await screen.findByRole("link", { name: /Example technology headline/ });

    const thumbnail = container.querySelector<HTMLImageElement>(".news-thumbnail img");
    expect(thumbnail).not.toBeNull();
    fireEvent.error(thumbnail!);

    expect(container.querySelector(".news-thumbnail-fallback")).toHaveTextContent("T");
    expect(container.querySelector(".news-thumbnail img")).not.toBeInTheDocument();
  });
});
