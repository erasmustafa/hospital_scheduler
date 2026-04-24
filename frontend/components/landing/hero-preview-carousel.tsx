"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type HeroPreviewItem = {
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
};

type HeroPreviewCarouselProps = {
  items: HeroPreviewItem[];
  autoAdvanceMs?: number;
};

const swipeConfidenceThreshold = 6000;

function swipePower(offset: number, velocity: number) {
  return Math.abs(offset) * velocity;
}

export function HeroPreviewCarousel({
  items,
  autoAdvanceMs = 5800,
}: HeroPreviewCarouselProps) {
  const safeItems = useMemo(() => items.filter(Boolean), [items]);
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);

  const imageIndex =
    ((page % safeItems.length) + safeItems.length) % safeItems.length;

  useEffect(() => {
    if (safeItems.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setPage(([current]) => [current + 1, 1]);
    }, autoAdvanceMs);

    return () => window.clearInterval(intervalId);
  }, [autoAdvanceMs, safeItems.length]);

  if (safeItems.length === 0) {
    return null;
  }

  const activeItem = safeItems[imageIndex];

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[20px]">
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={activeItem.src}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 38 : -38, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction > 0 ? -38 : 38, scale: 0.985 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_event, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                setPage(([current]) => [current + 1, 1]);
              } else if (swipe > swipeConfidenceThreshold) {
                setPage(([current]) => [current - 1, -1]);
              }
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Image
              src={activeItem.src}
              alt={activeItem.alt}
              width={activeItem.width}
              height={activeItem.height}
              priority
              className="h-auto w-full rounded-[22px] select-none"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {safeItems.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/92">{activeItem.title}</p>
            <p className="text-xs text-white/62">
              Kaydırarak diğer ekranları inceleyin
            </p>
          </div>

          <div className="flex items-center gap-2">
            {safeItems.map((item, index) => (
              <button
                key={item.src}
                type="button"
                aria-label={item.title}
                onClick={() =>
                  setPage(([current]) => [current + (index - imageIndex), index > imageIndex ? 1 : -1])
                }
                className={`h-2.5 rounded-full transition-all ${
                  index === imageIndex
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
