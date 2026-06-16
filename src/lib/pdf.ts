import { jsPDF } from "jspdf";

const NAVY = "#0B2545";
const TEAL = "#0F8B8D";
const TEAL_LIGHT = "#E6F4F4";
const SLATE = "#475467";
const GREY_LINE = "#D8DEE4";
const INK = "#1F2937";

const PAGE_W = 612; // letter, pt
const PAGE_H = 792;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 64;
const FOOTER_Y = PAGE_H - 36;

/**
 * Shared branded PDF builder used for every export across the platform
 * (patient reports, call transcripts, claim summaries, etc.) so every
 * generated PDF shares the same DentalOS AI cover/header/footer styling.
 */
export class PdfReport {
  doc: jsPDF;
  y: number;
  title: string;
  subtitle: string;

  constructor(title: string, subtitle: string) {
    this.doc = new jsPDF({ unit: "pt", format: "letter" });
    this.title = title;
    this.subtitle = subtitle;
    this.y = 0;
    this.drawCover();
  }

  private drawCover() {
    const d = this.doc;
    d.setFillColor(NAVY);
    d.rect(0, 0, PAGE_W, PAGE_H, "F");
    d.setFillColor(TEAL);
    d.rect(0, PAGE_H * 0.46, PAGE_W, 3, "F");

    d.setFillColor("#2EC4B6");
    d.circle(MARGIN + 12, 70, 12, "F");
    d.setFontSize(12);
    d.setTextColor(NAVY);
    d.setFont("helvetica", "bold");
    d.text("D", MARGIN + 12, 74, { align: "center" });

    d.setFontSize(10);
    d.setTextColor("#CFE9E9");
    d.text("DENTALOS AI", MARGIN + 32, 74);

    d.setFontSize(26);
    d.setTextColor("#FFFFFF");
    d.setFont("helvetica", "bold");
    d.text(this.title, MARGIN, PAGE_H * 0.56, { maxWidth: CONTENT_W });

    d.setFontSize(12);
    d.setFont("helvetica", "normal");
    d.setTextColor("#CFE9E9");
    d.text(this.subtitle, MARGIN, PAGE_H * 0.56 + 26, { maxWidth: CONTENT_W });

    d.setFontSize(9.5);
    d.setTextColor("#9FC9C9");
    d.text(`Generated ${new Date().toLocaleString()}`, MARGIN, PAGE_H - 60);
    d.text("SmileCare Dental Group · (512) 555-0100 · 1234 Medical Drive, Austin TX 78701", MARGIN, PAGE_H - 46);

    d.addPage();
    this.y = HEADER_H + 16;
    this.drawPageHeader();
  }

  private drawPageHeader() {
    const d = this.doc;
    d.setFillColor(NAVY);
    d.rect(0, 0, PAGE_W, HEADER_H - 28, "F");
    d.setFontSize(10);
    d.setFont("helvetica", "bold");
    d.setTextColor("#FFFFFF");
    d.text(this.title, MARGIN, 24);
    d.setFontSize(8);
    d.setFont("helvetica", "normal");
    d.setTextColor("#9FC9C9");
    d.text("DentalOS AI", PAGE_W - MARGIN, 24, { align: "right" });
    d.setDrawColor(GREY_LINE);
  }

  private ensureSpace(needed: number) {
    if (this.y + needed > FOOTER_Y - 10) {
      this.doc.addPage();
      this.y = HEADER_H + 16;
      this.drawPageHeader();
    }
  }

  sectionTitle(text: string) {
    this.ensureSpace(28);
    const d = this.doc;
    d.setFillColor(TEAL);
    d.rect(MARGIN, this.y - 11, 3, 14, "F");
    d.setFontSize(13);
    d.setFont("helvetica", "bold");
    d.setTextColor(NAVY);
    d.text(text, MARGIN + 10, this.y);
    this.y += 16;
    d.setDrawColor(GREY_LINE);
    d.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 14;
  }

  paragraph(text: string) {
    this.ensureSpace(16);
    const d = this.doc;
    d.setFontSize(9.5);
    d.setFont("helvetica", "normal");
    d.setTextColor(INK);
    const lines = d.splitTextToSize(text, CONTENT_W) as string[];
    for (const line of lines) {
      this.ensureSpace(13);
      d.text(line, MARGIN, this.y);
      this.y += 13;
    }
    this.y += 4;
  }

  /** Two-column label/value rows, e.g. patient demographics. */
  keyValueRows(rows: [string, string][]) {
    const d = this.doc;
    const labelW = 140;
    for (const [label, value] of rows) {
      this.ensureSpace(15);
      d.setFontSize(9);
      d.setFont("helvetica", "bold");
      d.setTextColor(SLATE);
      d.text(label, MARGIN, this.y);
      d.setFont("helvetica", "normal");
      d.setTextColor(INK);
      const lines = d.splitTextToSize(value || "—", CONTENT_W - labelW) as string[];
      d.text(lines[0] ?? "—", MARGIN + labelW, this.y);
      this.y += 14;
      for (const extra of lines.slice(1)) {
        this.ensureSpace(13);
        d.text(extra, MARGIN + labelW, this.y);
        this.y += 13;
      }
    }
    this.y += 6;
  }

  bulletList(items: string[]) {
    const d = this.doc;
    d.setFontSize(9.5);
    d.setFont("helvetica", "normal");
    d.setTextColor(INK);
    for (const item of items) {
      const lines = d.splitTextToSize(item, CONTENT_W - 14) as string[];
      this.ensureSpace(13 * lines.length);
      d.setFillColor(TEAL);
      d.circle(MARGIN + 3, this.y - 3, 1.6, "F");
      lines.forEach((line, i) => {
        d.text(line, MARGIN + 12, this.y + i * 13);
      });
      this.y += 13 * lines.length + 2;
    }
    this.y += 4;
  }

  /** Simple styled table with a teal header row and zebra striping. */
  table(headers: string[], rows: string[][], colWidths?: number[]) {
    const d = this.doc;
    const widths = colWidths ?? headers.map(() => CONTENT_W / headers.length);
    const rowH = 18;

    const drawHeaderRow = () => {
      d.setFillColor(TEAL);
      d.rect(MARGIN, this.y, CONTENT_W, rowH, "F");
      d.setFontSize(8.5);
      d.setFont("helvetica", "bold");
      d.setTextColor("#FFFFFF");
      let x = MARGIN + 6;
      headers.forEach((h, i) => {
        d.text(h, x, this.y + 12);
        x += widths[i];
      });
      this.y += rowH;
    };

    this.ensureSpace(rowH * 2);
    drawHeaderRow();

    rows.forEach((row, idx) => {
      this.ensureSpace(rowH);
      if (this.y === HEADER_H + 16) drawHeaderRow();
      if (idx % 2 === 1) {
        d.setFillColor(TEAL_LIGHT);
        d.rect(MARGIN, this.y, CONTENT_W, rowH, "F");
      }
      d.setFontSize(8.3);
      d.setFont("helvetica", "normal");
      d.setTextColor(INK);
      let x = MARGIN + 6;
      row.forEach((cellText, i) => {
        const maxW = widths[i] - 8;
        const text = d.splitTextToSize(String(cellText), maxW)[0] as string;
        d.text(text, x, this.y + 12);
        x += widths[i];
      });
      d.setDrawColor(GREY_LINE);
      d.line(MARGIN, this.y + rowH, PAGE_W - MARGIN, this.y + rowH);
      this.y += rowH;
    });
    this.y += 10;
  }

  spacer(h = 10) {
    this.y += h;
  }

  /** Finalizes footers (page numbers) across all content pages and saves. */
  save(filename: string) {
    const d = this.doc;
    const pageCount = d.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      d.setPage(i);
      d.setDrawColor(GREY_LINE);
      d.line(MARGIN, FOOTER_Y, PAGE_W - MARGIN, FOOTER_Y);
      d.setFontSize(8);
      d.setFont("helvetica", "normal");
      d.setTextColor(SLATE);
      d.text("DentalOS AI Platform", MARGIN, FOOTER_Y + 14);
      d.text(`Page ${i - 1} of ${pageCount - 1}`, PAGE_W - MARGIN, FOOTER_Y + 14, { align: "right" });
    }
    d.save(filename);
  }
}
