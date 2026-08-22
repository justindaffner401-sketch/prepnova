import { describe, expect, it } from "vitest";
import { assertSafeUrl, htmlToText, ImportError, isPrivateAddress } from "@/lib/ingest/website";
import { ExtractionError, safeStorageName, titleFromFilename, validateFile } from "@/lib/ingest/extract";
import { limits } from "@/lib/config";

/**
 * Ingestion security. Fetching a URL a user supplies is server-side request
 * forgery territory, so the address checks are tested explicitly.
 */

describe("website import: SSRF defence", () => {
  it("blocks loopback and link-local addresses", () => {
    for (const host of ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254", "metadata.google.internal"]) {
      expect(isPrivateAddress(host), host).toBe(true);
    }
  });

  it("blocks private IPv4 ranges", () => {
    for (const host of ["10.0.0.5", "192.168.1.1", "172.16.4.4", "172.31.255.255"]) {
      expect(isPrivateAddress(host), host).toBe(true);
    }
  });

  it("blocks IPv6 unique-local and link-local addresses", () => {
    for (const host of ["fe80::1", "fd00::1", "fc00::1", "::"]) {
      expect(isPrivateAddress(host), host).toBe(true);
    }
  });

  it("blocks internal-looking hostnames", () => {
    for (const host of ["db.internal", "printer.local", "api.localhost"]) {
      expect(isPrivateAddress(host), host).toBe(true);
    }
  });

  it("allows a genuine public camp website", () => {
    for (const host of ["campevergreen.com", "www.campevergreen.co.uk", "203.0.113.10", "172.32.0.1"]) {
      expect(isPrivateAddress(host), host).toBe(false);
    }
  });

  it("refuses non-http protocols", () => {
    for (const url of ["file:///etc/passwd", "ftp://example.com", "gopher://example.com"]) {
      expect(() => assertSafeUrl(url), url).toThrow(ImportError);
    }
  });

  it("refuses a private address even when it is a valid URL", () => {
    expect(() => assertSafeUrl("http://169.254.169.254/latest/meta-data/")).toThrow(ImportError);
  });

  it("accepts a normal camp URL", () => {
    expect(assertSafeUrl("https://campevergreen.com/about").hostname).toBe("campevergreen.com");
  });

  it("gives a friendly message rather than a technical one", () => {
    try {
      assertSafeUrl("not a url");
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as ImportError).userMessage).toContain("yourcamp.com");
    }
  });
});

describe("website import: text extraction", () => {
  it("takes readable text and drops scripts and styles", () => {
    const { title, text } = htmlToText(
      `<html><head><title>Camp Evergreen</title></head>
       <body><script>alert('x')</script><style>.a{}</style>
       <p>We run a sailing program.</p><nav>Home About</nav></body></html>`,
    );

    expect(title).toBe("Camp Evergreen");
    expect(text).toContain("We run a sailing program.");
    expect(text).not.toContain("alert");
    expect(text).not.toContain(".a{}");
    expect(text).not.toContain("Home About");
  });

  it("decodes HTML entities", () => {
    const { text } = htmlToText("<p>Camp&nbsp;Evergreen&rsquo;s &amp; friends &#8212; welcome</p>");
    expect(text).toContain("Camp Evergreen's & friends");
  });

  it("keeps paragraph breaks so the text stays readable", () => {
    const { text } = htmlToText("<p>First.</p><p>Second.</p>");
    expect(text).toContain("First.");
    expect(text).toContain("Second.");
  });
});

describe("file upload validation", () => {
  it("accepts the formats we support", () => {
    expect(validateFile({ name: "a.pdf", type: "application/pdf", size: 100 })).toBe("pdf");
    expect(
      validateFile({
        name: "a.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 100,
      }),
    ).toBe("docx");
    expect(validateFile({ name: "a.txt", type: "text/plain", size: 100 })).toBe("text");
  });

  it("falls back to the extension when the browser sends no MIME type", () => {
    expect(validateFile({ name: "newsletter.pdf", type: "", size: 100 })).toBe("pdf");
  });

  it("rejects executables and other unsupported types", () => {
    for (const name of ["virus.exe", "script.js", "photo.png", "sheet.xlsx"]) {
      expect(() => validateFile({ name, type: "application/octet-stream", size: 100 }), name).toThrow(ExtractionError);
    }
  });

  it("rejects a file over the size limit", () => {
    expect(() => validateFile({ name: "big.pdf", type: "application/pdf", size: limits.maxUploadBytes + 1 })).toThrow(
      ExtractionError,
    );
  });

  it("rejects an empty file", () => {
    expect(() => validateFile({ name: "empty.pdf", type: "application/pdf", size: 0 })).toThrow(ExtractionError);
  });

  it("explains the problem in plain language", () => {
    try {
      validateFile({ name: "photo.png", type: "image/png", size: 100 });
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as ExtractionError).userMessage).toContain("PDF, Word");
    }
  });
});

describe("storage naming", () => {
  it("never trusts the filename the browser sent", () => {
    const name = safeStorageName("../../etc/passwd.pdf");
    expect(name).not.toContain("..");
    expect(name).not.toContain("/");
    expect(name.endsWith(".pdf")).toBe(true);
  });

  it("strips unusual characters and stays unique", () => {
    const a = safeStorageName("Summer 2026 — Newsletter!.docx");
    const b = safeStorageName("Summer 2026 — Newsletter!.docx");
    expect(a).toMatch(/^summer-2026-newsletter-[a-f0-9]{8}\.docx$/);
    expect(a).not.toBe(b);
  });

  it("handles a file with no extension", () => {
    expect(safeStorageName("notes")).toMatch(/^notes-[a-f0-9]{8}$/);
  });

  it("makes a readable title from a filename", () => {
    expect(titleFromFilename("opening_day-email-2026.pdf")).toBe("opening day email 2026");
    expect(titleFromFilename(".pdf")).toBe("Uploaded document");
  });
});
