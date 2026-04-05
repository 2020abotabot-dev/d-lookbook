export default function NoImage({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 text-gray-400 text-xs ${className}`}
      aria-label="No image available"
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="4" fill="currentColor" opacity=".15"/>
        <path
          d="M8 24l6-8 4 5.3 3-4L24 24H8zM21 12a2 2 0 110-4 2 2 0 010 4z"
          fill="currentColor"
          opacity=".5"
        />
      </svg>
    </div>
  );
}
