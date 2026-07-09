import PDFDocument from "pdfkit";
import type { Response } from "express";

export function streamPortalPdf(res: Response, title: string, rows: string[]) {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title.toLowerCase().replaceAll(" ", "-")}.pdf"`);
  doc.pipe(res);
  doc.fontSize(18).text(title, { align: "center" }).moveDown();
  rows.forEach((row) => doc.fontSize(11).text(row).moveDown(0.4));
  doc.end();
}
