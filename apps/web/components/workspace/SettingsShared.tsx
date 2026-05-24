"use client";

export type SettingsTab = "account" | "workspace";

export type ProfileResponse = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  preferences?: Record<string, unknown>;
  connectedAccounts?: string[];
};

export type WorkspaceSettingsResponse = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    settings: {
      defaultPageVisibility: "workspace" | "public_link" | "private";
      allowGuestAccess: boolean;
    };
  };
  viewerRole: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
  members: Array<{
    id: string;
    role: "OWNER" | "EDITOR" | "VIEWER" | "MEMBER";
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
};

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl bg-[var(--color-surface)] p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {description ? (
          <p className="text-xs text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
      <div className="space-y-1">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        {description ? (
          <div className="text-xs text-[var(--color-text-secondary)]">{description}</div>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function DisabledPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-hover)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

export function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-[var(--color-hover)] ${className ?? ""}`}
      style={style}
    />
  );
}

export function ActionButton({
  children,
  disabled,
  variant = "primary",
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : variant === "danger"
        ? "bg-[#D44C47] text-white hover:opacity-90"
        : variant === "secondary"
          ? "bg-[var(--color-hover)] text-[var(--color-text-primary)] hover:opacity-90"
          : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
