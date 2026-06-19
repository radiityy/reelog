"use client";

import { signOut } from "next-auth/react";

type UserMenuProps = {
  username: string;
  image: string | null;
};

export function UserMenu({ username, image }: UserMenuProps) {
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="border-t border-[#211E1B] pt-4">
      <div className="flex items-center gap-3 px-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211E1B] bg-cover bg-center text-sm font-bold text-[#C84B18]"
          style={
            image
              ? {
                  backgroundImage: `url("${image}")`,
                }
              : undefined
          }
        >
          {!image ? initial : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#EDE8DE]">
            @{username}
          </p>

          <p className="mt-0.5 text-xs text-[#6E6862]">
            Reelog account
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          signOut({
            callbackUrl: "/",
          })
        }
        className="mt-4 w-full rounded-md px-3 py-2 text-left text-xs text-[#6E6862] transition hover:bg-[#171411] hover:text-[#EDE8DE]"
      >
        Sign out
      </button>
    </div>
  );
}