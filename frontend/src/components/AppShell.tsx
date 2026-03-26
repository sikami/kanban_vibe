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
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)] transition hover:border-[var(--navy-dark)]"
          data-testid="logout-button"
        >
          Log out{username ? ` ${username}` : ""}
        </button>
      }
    />
  );
};
