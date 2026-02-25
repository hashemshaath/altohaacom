import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Use CDN worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  
  if (ext === "txt" || file.type === "text/plain") {
    return file.text();
  }
  
  if (ext === "pdf" || file.type === "application/pdf") {
    return extractFromPDF(file);
  }
  
  if (ext === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractFromDOCX(file);
  }
  
  if (ext === "doc" || file.type === "application/msword") {
    // .doc (legacy) can't be easily parsed client-side, fallback to text
    const text = await file.text();
    if (text.trim().length > 50) return text;
    throw new Error("OLD_DOC_FORMAT");
  }
  
  throw new Error("UNSUPPORTED_FORMAT");
}

async function extractFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    if (pageText.trim()) pages.push(pageText);
  }
  
  return pages.join("\n\n");
}

async function extractFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
