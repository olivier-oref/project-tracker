jest.mock("@/lib/db", () => ({ db: {} }));

import { escapeHtml, formatDueDate, slugifyProjectTitle } from "./export";

describe("escapeHtml", () => {
  it("neutralises markup and attribute breakouts in user text", () => {
    expect(escapeHtml(`<script>alert("x")</script> & co`))
      .toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co");
  });
  it("escapes & first so entities aren't double-mangled", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("formatDueDate", () => {
  it("flags a missing due date", () => {
    expect(formatDueDate(null)).toBe('<span class="nodate">No date</span>');
  });
  it("renders the calendar date as written, without a timezone shift", () => {
    expect(formatDueDate("2026-01-01")).toBe('<span class="dt">Thu, Jan 1, 2026</span>');
  });
});

describe("slugifyProjectTitle", () => {
  it("lower-cases, collapses separators and trims dashes", () => {
    expect(slugifyProjectTitle("  BGC — GPU Desk: Launch!  ")).toBe("bgc-gpu-desk-launch");
    expect(slugifyProjectTitle("***")).toBe("");
  });
});
