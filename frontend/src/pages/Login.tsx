
import { useState } from "react";
import type { FormEvent, MouseEvent } from "react";

import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import AuthLayout from "../components/AuthLayout";
import {
  FieldError,
  PasswordInput,
} from "../components/AuthFields";

import { signIn } from "../services/authService";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthProvider";

type Errors = Record<string, string>;

const csunEmail = /^[^\s@]+@my\.csun\.edu$/i;

export default function Login() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loginErrors, setLoginErrors] =
    useState<Errors>({});

  const [loginPending, setLoginPending] =
    useState(false);

  const [loginNotice, setLoginNotice] =
    useState("");

  /* Sign in with Firebase */

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loginPending) return;

    const errors: Errors = {};

    if (!loginEmail.trim()) {
      errors.email = "Enter your CSUN email.";
    } else if (!csunEmail.test(loginEmail.trim())) {
      errors.email =
        "Use your CSUN student email, ending in @my.csun.edu.";
    }

    if (!loginPassword) {
      errors.password = "Enter your password.";
    }

    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoginPending(true);
    setLoginNotice("");

    try {
      await signIn({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      await refreshProfile();

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";

      setLoginNotice(message);
    } finally {
      setLoginPending(false);
    }
  }

  /* Send a password reset email */

  async function handleReset(
    event: MouseEvent<HTMLAnchorElement>
  ) {
    event.preventDefault();

    if (!csunEmail.test(loginEmail.trim())) {
      setLoginNotice(
        "Enter your CSUN email above to request a password reset."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        loginEmail.trim()
      );

      setLoginNotice(
        "If this email has an account, a password reset email will arrive shortly."
      );
    } catch (error) {
      setLoginNotice(
        error instanceof Error
          ? error.message
          : "Unable to request password reset."
      );
    }
  }

  return (
    <AuthLayout view="login">
      <h1 className="rr-auth__title">
        Welcome back
      </h1>

      <p className="rr-auth__sub">
        Log in with your CSUN email.
      </p>

      <form
        className="rr-auth__form"
        noValidate
        onSubmit={handleLogin}
      >
        {/* CSUN email */}

        <div
          className={`rr-field${
            loginErrors.email ? " has-error" : ""
          }`}
        >
          <label htmlFor="rr-login-email">
            CSUN email
          </label>

          <input
            id="rr-login-email"
            className="rr-input"
            type="email"
            autoComplete="email"
            placeholder="maya.rivera@my.csun.edu"
            value={loginEmail}
            aria-invalid={!!loginErrors.email}
            onChange={(event) => {
              setLoginEmail(event.target.value);

              setLoginErrors((current) => ({
                ...current,
                email: "",
              }));
            }}
          />

          <FieldError message={loginErrors.email} />
        </div>

        {/* Password */}

        <div
          className={`rr-field${
            loginErrors.password ? " has-error" : ""
          }`}
        >
          <div className="rr-field__row">
            <label htmlFor="rr-login-password">
              Password
            </label>

            <a
              className="rr-auth__forgot"
              href="#"
              onClick={handleReset}
            >
              Forgot password?
            </a>
          </div>

          <PasswordInput
            id="rr-login-password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={loginPassword}
            invalid={!!loginErrors.password}
            onChange={(value) => {
              setLoginPassword(value);

              setLoginErrors((current) => ({
                ...current,
                password: "",
              }));
            }}
          />

          <FieldError message={loginErrors.password} />
        </div>

        {/* Log in button */}

        <button
          className="rr-auth__btn rr-auth__btn--primary"
          type="submit"
          disabled={loginPending}
        >
          {loginPending ? "Signing in..." : "Log in"}
        </button>

        {loginNotice && (
          <p className="rr-auth__notice" role="status">
            {loginNotice}
          </p>
        )}

        {/* Create account link */}

        <p className="rr-auth__fine">
          New to RoomieReport?{" "}
          <Link to="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}