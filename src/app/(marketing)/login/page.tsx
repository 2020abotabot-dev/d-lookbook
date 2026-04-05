import { signIn } from "@/app/actions/auth";

export const metadata = { title: "Log in — DLookBook" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Log in to your DLookBook workspace.</p>

        <form action={signIn} className="auth-form">
          <label className="auth-label">
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="you@brand.com"
              className="auth-input"
            />
          </label>

          <label className="auth-label">
            Password
            <input
              name="password"
              type="password"
              required
              placeholder="Your password"
              className="auth-input"
            />
          </label>

          <button type="submit" className="auth-btn">
            Log in
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="auth-link">Sign up free</a>
        </p>
      </div>
    </div>
  );
}
