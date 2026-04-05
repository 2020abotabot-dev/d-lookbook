import { signUp } from "@/app/actions/auth";

export const metadata = { title: "Sign up — DLookBook" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check_email?: string }>;
}) {
  const params = await searchParams;

  if (params.check_email) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub">
            We sent a confirmation link to your email address. Click it to activate
            your account and sign in.
          </p>
          <p className="auth-footer">
            <a href="/login" className="auth-link">Back to login</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your lookbook workspace</h1>
        <p className="auth-sub">Sign up free — no credit card required.</p>

        {params.error && (
          <p className="auth-error">{decodeURIComponent(params.error).replace(/_/g, " ")}</p>
        )}

        <form action={signUp} className="auth-form">
          <label className="auth-label">
            Brand name
            <input
              name="brand_name"
              type="text"
              required
              placeholder="e.g. Acme Outdoors"
              className="auth-input"
            />
          </label>

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
              minLength={8}
              placeholder="Min. 8 characters"
              className="auth-input"
            />
          </label>

          <button type="submit" className="auth-btn">
            Create workspace
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <a href="/login" className="auth-link">Log in</a>
        </p>
      </div>
    </div>
  );
}
