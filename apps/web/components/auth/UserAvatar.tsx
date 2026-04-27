"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

interface UserAvatarProps {
  size?: number;
  className?: string;
  shape?: "circle" | "square";
}

export function UserAvatar({
  size = 32,
  className,
  shape = "circle",
}: UserAvatarProps) {
  const { data: session } = useSession();
  const shapeClass = shape === "square" ? "rounded-md" : "rounded-full";

  if (!session?.user?.image) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--color-accent)] text-white ${shapeClass} ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-medium">
          {session?.user?.name?.charAt(0) || "U"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={session.user.image}
      alt={session.user.name || "User"}
      width={size}
      height={size}
      className={`object-cover ${shapeClass} ${className}`}
    />
  );
}
