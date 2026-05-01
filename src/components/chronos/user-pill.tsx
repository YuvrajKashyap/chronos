import { ChevronDown } from "lucide-react";

export function UserPill() {
  return (
    <button className="user-pill" type="button" aria-label="Yuvraj Kashyap account menu">
      <span className="user-avatar">YK</span>
      <span className="user-name">Yuvraj Kashyap</span>
      <ChevronDown size={18} strokeWidth={2.1} aria-hidden="true" />
    </button>
  );
}
