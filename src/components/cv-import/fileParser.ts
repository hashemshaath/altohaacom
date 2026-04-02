// All heavy libraries are dynamically imported to avoid loading them in the initial bundle.
// pdfjs-dist (~91 KiB) and mammoth (~40 KiB) are only needed when a user uploads a file.

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null;

function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`;
      return mod;
    });
  }
  return pdfjsLibPromise;
}

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
    const text = await file.text();
    if (text.trim().length > 50) return text;
    throw new Error("OLD_DOC_FORMAT");
  }

  throw new Error("UNSUPPORTED_FORMAT");
}

async function extractFromPDF(file: File): Promise<string> {
  const pdfjsLib = await getPdfjsLib();
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
  const mammoth = (await import("mammoth")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
