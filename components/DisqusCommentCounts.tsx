"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    DISQUSWIDGETS?: {
      getCount: (options?: { reset?: boolean }) => void;
    };
  }
}

const DISQUS_COUNT_SCRIPT_ID = "dsq-count-scr";
const DISQUS_COUNT_SCRIPT_SRC = "https://playsafe-games.disqus.com/count.js";

export default function DisqusCommentCounts() {
  useEffect(() => {
    if (window.DISQUSWIDGETS) {
      window.DISQUSWIDGETS.getCount({ reset: true });
      return;
    }

    if (document.getElementById(DISQUS_COUNT_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = DISQUS_COUNT_SCRIPT_ID;
    script.src = DISQUS_COUNT_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
