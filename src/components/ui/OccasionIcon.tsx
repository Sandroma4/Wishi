export function OccasionIcon({
  kind = "gift",
}: {
  kind?: "gift" | "calendar" | "people";
}) {
  return (
    <svg
      aria-hidden="true"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "calendar" ? (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2" />
        </>
      ) : kind === "people" ? (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m3 10v-2a6 6 0 0 0-3-5" />
        </>
      ) : (
        <>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M5 12v9h14v-9m-7-4v13" />
          <path d="M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z" />
        </>
      )}
    </svg>
  );
}
