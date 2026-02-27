import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AdminPageTransition({ children }: Props) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  );
}
