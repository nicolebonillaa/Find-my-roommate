
import { useEffect, useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { ArrowLeft, Mail } from "lucide-react";

import {
  reload,
  sendEmailVerification,
} from "firebase/auth";

import AuthLayout from "../components/AuthLayout";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthProvider";

interface VerifyLocationState {
  email?: string;
}

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const { refreshProfile } = useAuth();

  const state =
    location.state as VerifyLocationState | null;

  const verifiedEmail =
    state?.email ||
    auth.currentUser?.email ||
    "your CSUN email";

  const [countdown, setCountdown] = useState(30);
  const [resent, setResent] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  /* Resend countdown */

  useEffect(() => {
    if (countdown <= 0) return;

    const timeout = window.setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [countdown]);

  /* Send another verification email */

  async function handleResend() {
    const current = auth.currentUser;

    if (!current) {
      setNotice(
        "Please sign in to resend a verification email."
      );
      return;
    }

    setPending(true);
    setNotice("");

    try {
      await sendEmailVerification(current);

      setResent(true);
      setCountdown(30);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to resend verification email."
      );
    } finally {
      setPending(false);
    }
  }

  /* Check whether the email is verified */

  async function handleVerified() {
    const current = auth.currentUser;

    if (!current) {
      setNotice(
        "Please log in after verifying your email."
      );
      return;
    }

    setPending(true);
    setNotice("");

    try {
      await reload(current);
      await current.getIdToken(true);

      if (!current.emailVerified) {
        setNotice(
          "Your email isn't verified yet. Open the link in your inbox, then try again."
        );
        return;
      }

      await refreshProfile();

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to finish email verification."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout view="verify">
      {/* Back link */}

      <Link
        className="rr-auth__back"
        to="/signup"
      >
        <ArrowLeft
          size={16}
          aria-hidden="true"
        />
        Use a different email
      </Link>

      <div className="rr-auth__verify">
        {/* Email icon */}

        <span className="rr-auth__verify-icon">
          <Mail
            size={24}
            aria-hidden="true"
          />
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

        {/* Verification buttons */}

        <div className="rr-auth__verify-actions">
          <button
            className="rr-auth__btn rr-auth__btn--secondary"
            type="button"
            disabled={countdown > 0 || pending}
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

          <button
            className="rr-auth__btn rr-auth__btn--primary"
            type="button"
            disabled={pending}
            onClick={handleVerified}
          >
            {pending
              ? "Checking..."
              : "I've verified my email"}
          </button>

          {notice && (
            <p
              className="rr-auth__notice"
              role="status"
            >
              {notice}
            </p>
          )}

          <p className="rr-auth__fine">
            <Link to="/login">
              Back to Log in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}