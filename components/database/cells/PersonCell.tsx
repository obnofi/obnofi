"use client";

import { useState, useRef, useEffect } from "react";
import { User, X } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  avatar?: string;
}

interface PersonCellProps {
  value: string | null;
  users?: UserData[];
  onChange: (userId: string | null) => void;
}

export function PersonCell({
  value,
  users = [],
  onChange,
}: PersonCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => u.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {selectedUser ? (
          <div className="flex items-center gap-1.5">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {getInitials(selectedUser.name)}
              </div>
            )}
            <span className="text-[#111110] dark:text-zinc-100">
              {selectedUser.name}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="ml-1 cursor-pointer rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700"
            >
              <X className="h-3 w-3" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <User className="h-4 w-4" />
            <span>Empty</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[99999] mt-1 min-w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {users.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-400">
              No users available
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <User className="h-4 w-4" />
                Empty
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onChange(user.id);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="text-[#111110] dark:text-zinc-100">
                    {user.name}
                  </span>
                  {value === user.id && (
                    <span className="ml-auto text-[#2E7D45]">✓</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
