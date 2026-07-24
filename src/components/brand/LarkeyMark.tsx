import type { SVGProps } from "react";

export function LarkeyMark({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...rest}
    >
      <rect width="64" height="64" rx="14" className="fill-brand" />
      <path
        d="M12 20 Q12 12 20 12 H44 Q52 12 52 20 V38 Q52 46 44 46 H28 L18 55 V46 Q12 46 12 38 Z"
        className="fill-brand-foreground"
      />
      <path
        d="M25 21 V37 H41"
        className="stroke-brand"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
