"use client";

import { useEffect, useMemo, useState } from "react";

type TypewriterHeadingProps = {
  prefixText: string;
  transientText: string;
  finalText: string;
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
  className?: string;
};

export function TypewriterHeading({
  prefixText,
  transientText,
  finalText,
  typingSpeedMs = 38,
  deletingSpeedMs = 24,
  pauseMs = 520,
  className,
}: TypewriterHeadingProps) {
  const reserveText = useMemo(
    () =>
      Array.from(`${prefixText}${finalText}`).length >=
      Array.from(`${prefixText}${transientText}`).length
        ? `${prefixText}${finalText}`
        : `${prefixText}${transientText}`,
    [finalText, prefixText, transientText],
  );
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let cancelled = false;
    const sleep = (delay: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, delay);
      });

    const typeAppend = async (textToAppend: string, speed: number) => {
      for (const char of Array.from(textToAppend)) {
        if (cancelled) {
          return;
        }

        setDisplayText((current) => current + char);
        await sleep(speed);
      }
    };

    const deleteChars = async (count: number, speed: number) => {
      for (let index = 0; index < count; index += 1) {
        if (cancelled) {
          return;
        }

        setDisplayText((current) => {
          const chars = Array.from(current);
          if (chars.length === 0) {
            return current;
          }

          return chars.slice(0, -1).join("");
        });
        await sleep(speed);
      }
    };

    setDisplayText("");

    void (async () => {
      await typeAppend(prefixText, typingSpeedMs);
      await sleep(Math.round(pauseMs * 0.75));
      await typeAppend(transientText, typingSpeedMs);
      await sleep(pauseMs);
      await deleteChars(Array.from(transientText).length, deletingSpeedMs);
      await sleep(Math.round(pauseMs * 0.55));
      await typeAppend(finalText, typingSpeedMs);
    })();

    return () => {
      cancelled = true;
    };
  }, [deletingSpeedMs, finalText, pauseMs, prefixText, transientText, typingSpeedMs]);

  return (
    <span className={`relative block ${className ?? ""}`}>
      <span aria-hidden="true" className="invisible block whitespace-pre-wrap">
        {reserveText}
      </span>

      <span className="absolute inset-0 block whitespace-pre-wrap">
        {displayText}
        <span
          aria-hidden="true"
          className="ml-1 inline-block h-[0.9em] w-[0.08em] translate-y-[0.08em] animate-pulse rounded-full bg-current align-baseline"
        />
      </span>
    </span>
  );
}
