import * as pdfParse from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to parse PDF document: " + (error.message || String(error)));
  }
}