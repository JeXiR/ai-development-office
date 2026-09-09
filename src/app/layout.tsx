import type { Metadata } from "next";
import {readRequestLanguage} from "@/i18n/read-request-language";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Development Office",
  description: "Live visualization for AI Development Kit",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang=await readRequestLanguage();
  return (
    <html lang={lang||"en"}>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function hide(){document.querySelectorAll("[data-next-badge],[data-next-badge-root]").forEach(function(el){el.remove();});document.querySelectorAll("nextjs-portal,[data-nextjs-toast]").forEach(function(el){if(el.querySelector("[data-nextjs-dialog],[data-nextjs-error],#nextjs__container_errors_label,.nextjs-container-errors-header"))return;el.remove();});}hide();if(typeof MutationObserver!=="undefined"){new MutationObserver(hide).observe(document.documentElement,{childList:true,subtree:true});}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
