"use client";

import { useState, type FormEvent } from "react";

type LoginFormProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
};

export const LoginForm = ({
  errorMessage,
  isSubmitting,
  onSubmit,
}: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const hasError = Boolean(errorMessage);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(username, password);
  };

  return (
    <main
      className="relative mx-auto flex min-h-screen max-w-[1100px] items-center px-6 py-12"
      data-testid="login-page"
    >
      <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section
          className="rounded-[32px] border border-[var(--stroke)] bg-white/85 p-10 shadow-[var(--shadow)] backdrop-blur"
          data-testid="login-intro"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            Project Management MVP
          </p>
          <h1
            className="mt-4 font-display text-5xl font-semibold text-[var(--navy-dark)]"
            data-testid="login-title"
          >
            Sign in to your board
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--gray-text)]">
            Sign in to access the local Kanban board and continue the MVP
            flow.
          </p>
        </section>

        <section
          className="rounded-[32px] border border-[var(--stroke)] bg-[var(--surface-strong)] p-8 shadow-[var(--shadow)]"
          data-testid="login-panel"
        >
          <form
            className="space-y-5"
            onSubmit={handleSubmit}
            data-testid="login-form"
          >
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-base text-[var(--navy-dark)] transition focus:border-[var(--primary-blue)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(32,157,215,0.24)]"
                autoComplete="username"
                aria-invalid={hasError}
                aria-describedby={hasError ? "login-error" : undefined}
                data-testid="login-username"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 pr-24 text-base text-[var(--navy-dark)] transition focus:border-[var(--primary-blue)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(32,157,215,0.24)]"
                  autoComplete="current-password"
                  aria-invalid={hasError}
                  aria-describedby={hasError ? "login-error" : undefined}
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary-blue)] transition hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(32,157,215,0.24)]"
                  data-testid="login-password-toggle"
                >
                  {isPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMessage ? (
              <p
                id="login-error"
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                data-testid="login-error"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(117,57,145,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
              data-testid="login-submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
