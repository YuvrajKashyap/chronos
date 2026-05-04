import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function UserPill() {
  return (
    <Link className="user-pill" href="/admin" aria-label="Yuvraj Kashyap admin">
      <span className="user-avatar">YK</span>
      <span className="user-name">Yuvraj Kashyap</span>
      <ChevronDown size={18} strokeWidth={2.1} aria-hidden="true" />
    </Link>
  );
}
