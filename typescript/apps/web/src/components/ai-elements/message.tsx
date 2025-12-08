"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export type MessageProps = ComponentProps<"div"> & {
  from: "user" | "assistant";
  children?: ReactNode;
};

export const Message = ({ from, className, children, ...props }: MessageProps) => (
  <div
    className={cn(
      "flex w-full",
      from === "user" ? "justify-end" : "justify-start",
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        from === "user"
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-muted text-foreground rounded-bl-sm"
      )}
    >
      {children}
    </div>
  </div>
);

export type MessageContentProps = ComponentProps<"div">;

export const MessageContent = ({ className, children, ...props }: MessageContentProps) => (
  <div className={cn("text-sm leading-relaxed", className)} {...props}>
    {children}
  </div>
);
