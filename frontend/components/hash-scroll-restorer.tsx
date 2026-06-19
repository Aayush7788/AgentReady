"use client";

import { useEffect } from "react";

export function HashScrollRestorer() {
  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (!target) return;

        const rootElement = document.documentElement;
        const previousBehavior = rootElement.style.scrollBehavior;
        rootElement.style.scrollBehavior = "auto";
        target.scrollIntoView({ block: "start" });
        rootElement.style.scrollBehavior = previousBehavior;
      });
    });

    return () => window.cancelAnimationFrame(firstFrame);
  }, []);

  return null;
}
