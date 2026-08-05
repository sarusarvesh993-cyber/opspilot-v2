import * as pdfParse from "pdf-parse";

interface PDFParseData {
  text: string;
  numpages: number;
  numrender: number;
  info: unknown;
  metadata: unknown;
  version: string;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data: PDFParseData = await pdfParse(buffer);
    return data.text || "";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to parse PDF document: " + message);
  }
}