"use client";

import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginForm } from "@/components/LoginForm";

type SessionResponse = {
  authenticated: boolean;
  username: string | null;
};

const DEMO_USERNAME = "user";
const DEMO_PASSWORD = "password";
const DEMO_SESSION_KEY = "pm_demo_auth";

const getJson = async <T,>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null;
    throw new Error(body?.detail ?? "Request failed.");
  }

  return (await response.json()) as T;
};

export const AppShell = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getJson<SessionResponse>("/api/session", {
          method: "GET",
        });
        setIsAuthenticated(session.authenticated);
        setUsername(session.username);
      } catch {
        const localAuthenticated =
          window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true";
        setIsAuthenticated(localAuthenticated);
        setUsername(localAuthenticated ? DEMO_USERNAME : null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSession();
  }, []);

  const handleLogin = async (enteredUsername: string, password: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const session = await getJson<SessionResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username: enteredUsername,
          password,
        }),
      });
      setIsAuthenticated(session.authenticated);
      setUsername(session.username);
    } catch (error) {
      if (
        enteredUsername === DEMO_USERNAME &&
        password === DEMO_PASSWORD
      ) {
        window.sessionStorage.setItem(DEMO_SESSION_KEY, "true");
        setIsAuthenticated(true);
        setUsername(DEMO_USERNAME);
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to sign in."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setErrorMessage(null);
    try {
      await getJson<{ authenticated: boolean }>("/api/logout", {
        method: "POST",
      });
    } catch {
      // The frontend-only dev server has no backend session API.
    }
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    setIsAuthenticated(false);
    setUsername(null);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p
          className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]"
          data-testid="session-loading"
        >
          Loading session
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <KanbanBoard
      headerActions={
        <div className="group relative">
          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label={username ? `Log out ${username}` : "Log out"}
            title={username ? `Log out ${username}` : "Log out"}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--stroke)] bg-white/90 text-[var(--navy-dark)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--navy-dark)] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(3,33,71,0.14)]"
            data-testid="logout-button"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 7l5 5-5 5" />
              <path d="M19 12H9" />
              <path d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h5" />
            </svg>
          </button>
          <span
            className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-[var(--navy-dark)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            Log out
          </span>
        </div>
      }
    />
  );
};
