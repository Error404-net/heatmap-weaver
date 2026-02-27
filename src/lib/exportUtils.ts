import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function exportPNG(element: HTMLElement, filename = 'matrix.png') {
  const url = await toPng(element, { quality: 1, pixelRatio: 2 });
  download(url, filename);
}

export async function exportSVG(element: HTMLElement, filename = 'matrix.svg') {
  const url = await toSvg(element);
  download(url, filename);
}

export async function exportPDF(element: HTMLElement, filename = 'matrix.pdf') {
  const url = await toPng(element, { quality: 1, pixelRatio: 2 });
  const img = new Image();
  img.src = url;
  await new Promise(r => (img.onload = r));
  const pdf = new jsPDF({
    orientation: img.width > img.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [img.width, img.height],
  });
  pdf.addImage(url, 'PNG', 0, 0, img.width, img.height);
  pdf.save(filename);
}

function download(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
