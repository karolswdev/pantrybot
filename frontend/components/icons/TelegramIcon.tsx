'use client';

import { SVGProps } from 'react';

interface TelegramIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Official Telegram logo icon
 * Uses Telegram's brand color (#2AABEE) by default
 */
export function TelegramIcon({
  size = 24,
  className = '',
  ...props
}: TelegramIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Telegram logo with official brand colors (for use on light backgrounds)
 */
export function TelegramBrandIcon({
  size = 24,
  className = '',
  ...props
}: TelegramIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="telegram-gradient" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#37AEE2" />
          <stop offset="1" stopColor="#1E96C8" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#telegram-gradient)" />
      <path
        d="M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"
        fill="#C8DAEA"
      />
      <path
        d="M98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035"
        fill="#A9C9DD"
      />
      <path
        d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"
        fill="#F6FBFE"
      />
    </svg>
  );
}

export default TelegramIcon;
