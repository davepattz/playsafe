"use client";

/* eslint-disable react-hooks/unsupported-syntax */

import { useEffect } from "react";

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config: () => void;
      }) => void;
    };
    disqus_config?: () => void;
  }
}

interface DisqusCommentsProps {
  identifier: string;
  title: string;
}

const DISQUS_SHORTNAME = "playsafe-games";

export default function DisqusComments({
  identifier,
  title,
}: DisqusCommentsProps) {
  useEffect(() => {
    const configureDisqus = function (this: {
      page: {
        url?: string;
        identifier?: string;
        title?: string;
      };
    }) {
      this.page.url = window.location.href;
      this.page.identifier = identifier;
      this.page.title = title;
    };

    window.disqus_config = configureDisqus;

    if (window.DISQUS) {
      window.DISQUS.reset({
        reload: true,
        config: configureDisqus,
      });

      return;
    }

    const script = document.createElement("script");
    script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
    script.setAttribute("data-timestamp", String(Date.now()));
    script.async = true;
    document.body.appendChild(script);
  }, [identifier, title]);

  return (
    <section className="mt-8 rounded-[22px] border-2 border-black bg-white p-6 md:p-8">
      <h2 className="font-['Lato'] text-[28px] font-bold leading-tight text-black">
        Comments
      </h2>
      <div id="disqus_thread" className="mt-6" />
      <noscript>
        Please enable JavaScript to view the{" "}
        <a href="https://disqus.com/?ref_noscript">
          comments powered by Disqus.
        </a>
      </noscript>
    </section>
  );
}
