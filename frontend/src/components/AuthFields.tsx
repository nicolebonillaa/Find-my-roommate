
import { useState } from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";

export function FieldError({
  message,
}: {
  message?: string;
}) {
  return (
    <p className="rr-field__error" aria-live="polite">
      {message && (
        <>
          <CircleAlert size={14} aria-hidden="true" />
          <span>{message}</span>
        </>
      )}
    </p>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: "new-password" | "current-password";
  invalid?: boolean;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="rr-pw">
      <input
        className="rr-input"
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={!!invalid}
        onChange={(event) => onChange(event.target.value)}
      />

      <button
        className="rr-pw__toggle"
        type="button"
        aria-label={
          visible ? "Hide password" : "Show password"
        }
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff size={16} />
        ) : (
          <Eye size={16} />
        )}
      </button>
    </div>
  );
}