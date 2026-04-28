import type { CSSProperties, FocusEvent } from "react";

export const inputStyle: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#e2e8f0",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
};

export function focusHandler(e: FocusEvent<HTMLInputElement>, rgb: string) {
  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${rgb},0.2)`;
  e.currentTarget.style.borderColor = `rgba(${rgb},0.3)`;
}

export function blurHandler(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.2)";
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
}