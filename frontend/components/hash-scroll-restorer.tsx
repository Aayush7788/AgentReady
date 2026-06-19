"use client";

import { useEffect } from "react";

export function HashScrollRestorer() {
  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: "start" });
      });
    });

    return () => window.cancelAnimationFrame(firstFrame);
  }, []);

  return null;
}
