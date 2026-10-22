
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import {
  FieldError,
  PasswordInput,
} from "../components/AuthFields";

type Errors = Record<string, string>;

const csunEmail = /^[^\s@]+@my\.csun\.edu$/i;

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupErrors, setSignupErrors] = useState<Errors>({});

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: Errors = {};

    if (!name.trim()) {
      errors.name = "Enter your full name.";
    }

    if (!signupEmail.trim()) {
      errors.email = "Enter your CSUN email.";
    } else if (!csunEmail.test(signupEmail.trim())) {
      errors.email =
        "Use your CSUN student email, ending in @my.csun.edu.";
    }

    if (signupPassword.length < 8) {
      errors.password = "Use at least 8 characters.";
    }

    setSignupErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // Firebase account creation will be connected later.
    navigate("/verify", {
      state: {
        email: signupEmail.trim(),
      },
    });
  }

  return (
    <AuthLayout view="signup">
      <h1 className="rr-auth__title">
        Create your account
      </h1>

      <p className="rr-auth__sub">
        Use your CSUN email so we can confirm you're a student.
      </p>

      <form
        className="rr-auth__form"
        noValidate
        onSubmit={handleSignup}
      >
        {/* Full name */}
        <div
          className={`rr-field${
            signupErrors.name ? " has-error" : ""
          }`}
        >
          <label htmlFor="rr-signup-name">
            Full name
          </label>

          <input
            id="rr-signup-name"
            className="rr-input"
            type="text"
            autoComplete="name"
            placeholder="Maya Rivera"
            value={name}
            aria-invalid={!!signupErrors.name}
            onChange={(event) => {
              setName(event.target.value);

              setSignupErrors((current) => ({
                ...current,
                name: "",
              }));
            }}
          />

          <FieldError message={signupErrors.name} />
        </div>

        {/* CSUN email */}
        <div
          className={`rr-field${
            signupErrors.email ? " has-error" : ""
          }`}
        >
          <label htmlFor="rr-signup-email">
            CSUN email
          </label>

          <input
            id="rr-signup-email"
            className="rr-input"
            type="email"
            autoComplete="email"
            placeholder="maya.rivera@my.csun.edu"
            value={signupEmail}
            aria-invalid={!!signupErrors.email}
            onChange={(event) => {
              setSignupEmail(event.target.value);

              setSignupErrors((current) => ({
                ...current,
                email: "",
              }));
            }}
          />

          <FieldError message={signupErrors.email} />
        </div>

        {/* Password */}
        <div
          className={`rr-field${
            signupErrors.password ? " has-error" : ""
          }`}
        >
          <label htmlFor="rr-signup-password">
            Password
          </label>

          <PasswordInput
            id="rr-signup-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={signupPassword}
            invalid={!!signupErrors.password}
            onChange={(value) => {
              setSignupPassword(value);

              setSignupErrors((current) => ({
                ...current,
                password: "",
              }));
            }}
          />

          <FieldError message={signupErrors.password} />
        </div>

        {/* Create account button */}
        <button
          className="rr-auth__btn rr-auth__btn--primary"
          type="submit"
        >
          Create account
        </button>

        <p className="rr-auth__fine">
          We'll email you a link to confirm your CSUN address.
        </p>
      </form>
    </AuthLayout>
  );
}