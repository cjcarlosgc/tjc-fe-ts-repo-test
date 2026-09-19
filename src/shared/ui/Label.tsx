import type { LabelHTMLAttributes } from "react";
export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`ui-label ${props.className ?? ""}`} />;
}
