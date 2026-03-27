import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/AppShell";

const mockFetch = vi.fn();

describe("AppShell", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the login form when the session is unauthenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, username: null }),
    });

    render(<AppShell />);

    expect(screen.getByTestId("session-loading")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: /sign in to your board/i })
    ).toBeInTheDocument();
  });

  it("logs in successfully and shows the board", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false, username: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, username: "user" }),
      });

    render(<AppShell />);

    await userEvent.type(
      await screen.findByTestId("login-username"),
      "user"
    );
    await userEvent.type(screen.getByTestId("login-password"), "password");
    await userEvent.click(screen.getByTestId("login-submit"));

    expect(
      await screen.findByRole("heading", { name: /kanban studio/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("logout-button")).toBeInTheDocument();
  });

  it("toggles password visibility on the login form", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false, username: null }),
    });

    render(<AppShell />);

    const passwordField = await screen.findByTestId("login-password");
    const toggle = screen.getByTestId("login-password-toggle");

    expect(passwordField).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-label", "Show password");

    await userEvent.click(toggle);

    expect(passwordField).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-label", "Hide password");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(toggle);

    expect(passwordField).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-label", "Show password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("shows an error when login fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false, username: null }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Invalid username or password." }),
      });

    render(<AppShell />);

    await userEvent.type(
      await screen.findByTestId("login-username"),
      "user"
    );
    await userEvent.type(screen.getByTestId("login-password"), "nope");
    await userEvent.click(screen.getByTestId("login-submit"));

    const error = await screen.findByRole("alert");

    expect(error).toHaveTextContent("Invalid username or password.");
    expect(screen.getByTestId("login-username")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByTestId("login-password")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("logs out after an authenticated session", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, username: "user" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      });

    render(<AppShell />);

    await userEvent.click(await screen.findByTestId("logout-button"));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to your board/i })
      ).toBeInTheDocument();
    });
  });
});
