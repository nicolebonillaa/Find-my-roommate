
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import "../styles/AuthPage.css";

type AuthView = "login" | "signup" | "verify";

interface AuthLayoutProps {
  view: AuthView;
  children: ReactNode;
}

export default function AuthLayout({
  view,
  children,
}: AuthLayoutProps) {
  return (
    <main className="rr-auth">
      <div className="rr-auth__wrap">
        <header className="rr-auth__brand">
          <h2>RoomieReport</h2>
          <p>CSUN student community</p>
        </header>

        <section
          className="rr-auth__main"
          aria-label="RoomieReport account"
        >
          <div className="rr-auth__view">
            {view !== "verify" && (
              <div
                className="rr-auth__tabs"
                role="tablist"
                aria-label="Account access"
              >
                <Link
                  role="tab"
                  aria-selected={view === "login"}
                  className={
                    view === "login" ? "is-active" : ""
                  }
                  to="/login"
                >
                  Log in
                </Link>

                <Link
                  role="tab"
                  aria-selected={view === "signup"}
                  className={
                    view === "signup" ? "is-active" : ""
                  }
                  to="/signup"
                >
                  Create account
                </Link>
              </div>
            )}

            {children}

            <p className="rr-auth__foot">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                Only verified CSUN students can join.
                Reviews stay private until both people submit.
              </span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}