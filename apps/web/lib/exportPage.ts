import type { Editor as TiptapEditor } from "@tiptap/core";
import type { Page } from "@obnofi/types";
import { buildPrintableHtml, escapeHtml, PDF_EXTRA_STYLES } from "@/lib/export/htmlTemplate";
import { clonePrintableContent, collectHeadMarkup, copyCanvasSnapshots } from "@/lib/export/domUtils";

interface ExportPageParams {
  editor: TiptapEditor | null;
  contentElement?: HTMLElement | null;
  page: Pick<Page, "title" | "icon" | "coverImage" | "type">;
}

const sanitizeFilename = (value: string) => {
  const trimmed = value.trim().replace(/[\\/:*?"<>|\x00-\x1F]/g, "_");
  return trimmed.length > 0 ? trimmed : "untitled";
};

export const exportPageAsHtml = (params: ExportPageParams) => {
  const html = buildPrintableHtml(params);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(params.page.title || "untitled")}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportPageAsPdf = (params: ExportPageParams) => {
  if (!params.contentElement) {
    const html = buildPrintableHtml(params);

    const fallbackIframe = document.createElement("iframe");
    fallbackIframe.style.position = "fixed";
    fallbackIframe.style.right = "0";
    fallbackIframe.style.bottom = "0";
    fallbackIframe.style.width = "0";
    fallbackIframe.style.height = "0";
    fallbackIframe.style.border = "0";
    fallbackIframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(fallbackIframe);

    const cleanupFallback = () => {
      setTimeout(() => {
        if (fallbackIframe.parentNode) fallbackIframe.parentNode.removeChild(fallbackIframe);
      }, 500);
    };

    fallbackIframe.onload = () => {
      const win = fallbackIframe.contentWindow;
      if (!win) {
        cleanupFallback();
        return;
      }
      try {
        win.focus();
        win.print();
      } finally {
        const onAfterPrint = () => {
          win.removeEventListener("afterprint", onAfterPrint);
          cleanupFallback();
        };
        win.addEventListener("afterprint", onAfterPrint);
        setTimeout(cleanupFallback, 60_000);
      }
    };

    const doc = fallbackIframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    return;
  }

  const safeTitle = params.page.title?.trim() ? params.page.title : "Untitled";
  const printableContent = clonePrintableContent(params.contentElement);
  const headMarkup = collectHeadMarkup();

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win) {
      cleanup();
      return;
    }

    if (doc?.body) {
      doc.body.className = document.body.className;

      const shell = doc.createElement("div");
      shell.className = "page-shell";

      if (params.page.coverImage) {
        const canopy = doc.createElement("div");
        canopy.className = "page-canopy";

        const image = doc.createElement("img");
        image.src = params.page.coverImage;
        image.alt = "";
        canopy.appendChild(image);
        shell.appendChild(canopy);
      }

      const header = doc.createElement("header");
      header.className = "page-header";

      if (params.page.icon) {
        const icon = doc.createElement("div");
        icon.className = "page-icon";
        icon.textContent = params.page.icon;
        header.appendChild(icon);
      }

      const title = doc.createElement("h1");
      title.className = "page-title";
      title.textContent = safeTitle;
      header.appendChild(title);
      shell.appendChild(header);

      const article = doc.createElement("article");
      article.className = "page-content";
      const importedContent = doc.importNode(printableContent, true);
      article.appendChild(importedContent);
      shell.appendChild(article);

      doc.body.innerHTML = "";
      doc.body.appendChild(shell);
      copyCanvasSnapshots(params.contentElement, importedContent);
    }

    try {
      win.focus();
      win.print();
    } finally {
      const onAfterPrint = () => {
        win.removeEventListener("afterprint", onAfterPrint);
        cleanup();
      };
      win.addEventListener("afterprint", onAfterPrint);
      setTimeout(cleanup, 60_000);
    }
  };

  const doc = iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(safeTitle)}</title>
${headMarkup}
<style>${PDF_EXTRA_STYLES}</style>
</head>
<body></body>
</html>`);
    doc.close();
  }
};
