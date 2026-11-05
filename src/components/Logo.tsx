/**
 * The Subtext mark: a speech bubble, and beneath it a second line that follows the first.
 * What was said, and what sits under it.
 */
export function Logo({ size = 34, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path
        d="M8 6h24a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H18l-6.5 5.2a.7.7 0 0 1-1.1-.6V26H8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"
        fill="none"
        stroke="#f6f3ec"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M11 13.5h18M11 18.5h11" stroke="#f6f3ec" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M17 35.5c4 0 6-2.4 10-2.4s6 2.4 9 2.4" fill="none" stroke="#c5bbe8" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
