import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#2e3038] p-10 text-center bg-[#040406]/50 ${className}`}
    >
      {icon ? (
        <div className="mb-3 text-[#777a88]">{icon}</div>
      ) : (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#121317] border border-[#1c1d22] text-[#9194a1]">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#ffffff]">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-[#777a88]">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-full bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#08080a] hover:bg-[#e2e3e9] transition-colors shadow-xs cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
