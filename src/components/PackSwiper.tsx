"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

// Offres côte à côte sur ordinateur ; sur mobile, une offre à la fois que l'on fait glisser,
// en commençant par celle mise en avant, avec des points en dessous pour passer de l'une à l'autre.
export function PackSwiper({ children, start = 0, labels, className = "" }: { children: ReactNode; start?: number; labels: string[]; className?: string }) {
  const list = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(start);
  const count = Children.count(children);

  // Ouverture sur l'offre mise en avant (sans animation)
  useEffect(() => {
    const el = list.current;
    if (el && start > 0) el.scrollLeft = el.clientWidth * start;
  }, [start]);

  const onScroll = () => {
    const el = list.current;
    if (el && el.clientWidth) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };
  const go = (i: number) => list.current?.scrollTo({ left: list.current.clientWidth * i, behavior: "smooth" });

  return (
    <div className={className}>
      <div ref={list} onScroll={onScroll}
        className="-mx-4 -my-6 flex items-start snap-x snap-mandatory overflow-x-auto py-6 overscroll-x-contain [scrollbar-width:none] md:mx-0 md:my-0 md:grid md:items-stretch md:py-0 md:snap-none md:grid-cols-3 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {Children.map(children, (child) => <div className="flex w-full shrink-0 snap-center px-4 md:px-0 [&>*]:w-full">{child}</div>)}
      </div>
      {count > 1 && (
        <div className="mt-2 flex justify-center gap-2 md:hidden">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={labels[i]} aria-current={i === current}
              className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-accent" : "w-2 bg-muted/40 hover:bg-muted"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
