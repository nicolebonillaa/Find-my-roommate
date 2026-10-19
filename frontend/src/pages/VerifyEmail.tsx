import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

interface VerifyLocationState {
  email?: string;
}

export default function VerifyEmail() {
  const location = useLocation();

  const state = location.state as
    | VerifyLocationState
    | null;

  const verifiedEmail =
    state?.email || "maya.rivera@my.csun.edu";

  const [countdown, setCountdown] = useState(30);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;

    const timeout = window.setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [countdown]);

  function handleResend() {
    // Frontend prototype only.
    // No verification email is sent yet.
    setResent(true);
    setCountdown(30);
  }

  return (
    <AuthLayout view="verify">
      <Link
        className="rr-auth__back"
        to="/signup"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Use a different email
      </Link>

      <div className="rr-auth__verify">
        <span className="rr-auth__verify-icon">
          <Mail size={24} aria-hidden="true" />
        </span>

        <h1 className="rr-auth__title">
          Check your inbox
        </h1>

        <p className="rr-auth__verify-text">
          We sent a link to{" "}
          <strong>{verifiedEmail}</strong>.
          Open it to confirm you're a CSUN student
          and finish creating your account.
        </p>

        <p className="rr-auth__verify-text">
          Can't find it? Check your spam folder.
        </p>

        <div className="rr-auth__verify-actions">
          <button
            className="rr-auth__btn rr-auth__btn--secondary"
            type="button"
            disabled={countdown > 0}
            onClick={handleResend}
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : "Resend email"}
          </button>

          {resent && (
            <p className="rr-auth__sent">
              Sent again.
            </p>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}