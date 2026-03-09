import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType,
} from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SaveFormat } from '../components/workspace/SaveDialog';
import type { Slide } from '../types';

/* ── helpers ──────────────────────────────────── */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* Strip HTML tags, preserve newlines */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText || tmp.textContent || '';
}

/* Parse HTML into docx Paragraphs (basic) */
function htmlToDocxParagraphs(html: string): Paragraph[] {
  const div = document.createElement('div');
  div.innerHTML = html;
  const paragraphs: Paragraph[] = [];

  const processNode = (node: ChildNode): Paragraph | null => {
    const el = node as HTMLElement;
    const tag = el.tagName?.toLowerCase();

    const textRuns = (): TextRun[] => {
      const runs: TextRun[] = [];
      el.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          runs.push(new TextRun({ text: child.textContent || '' }));
        } else {
          const c = child as HTMLElement;
          const ct = c.tagName?.toLowerCase();
          runs.push(new TextRun({
            text: c.textContent || '',
            bold: ct === 'strong' || ct === 'b',
            italics: ct === 'em' || ct === 'i',
            underline: ct === 'u' ? {} : undefined,
          }));
        }
      });
      return runs.length ? runs : [new TextRun({ text: el.textContent || '' })];
    };

    if (tag === 'h1') return new Paragraph({ heading: HeadingLevel.HEADING_1, children: textRuns() });
    if (tag === 'h2') return new Paragraph({ heading: HeadingLevel.HEADING_2, children: textRuns() });
    if (tag === 'h3') return new Paragraph({ heading: HeadingLevel.HEADING_3, children: textRuns() });
    if (tag === 'p' || tag === 'div') return new Paragraph({ children: textRuns() });
    if (tag === 'li') return new Paragraph({ bullet: { level: 0 }, children: textRuns() });
    if (tag === 'ul' || tag === 'ol') {
      el.childNodes.forEach(child => {
        const p = processNode(child);
        if (p) paragraphs.push(p);
      });
      return null;
    }
    if (el.textContent?.trim()) return new Paragraph({ children: [new TextRun({ text: el.textContent })] });
    return null;
  };

  div.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: node.textContent })] }));
    } else {
      const p = processNode(node);
      if (p) paragraphs.push(p);
    }
  });

  return paragraphs.length ? paragraphs : [new Paragraph({ children: [new TextRun({ text: '' })] })];
}

/* ── real .docx via docx library ── */
async function saveDocx(name: string, htmlContent: string) {
  const paragraphs = htmlToDocxParagraphs(htmlContent);
  const doc = new Document({
    creator: 'SkhoFlow',
    title: name,
    sections: [{ properties: {}, children: paragraphs }],
  });
  const buffer = await Packer.toBlob(doc);
  triggerDownload(buffer, `${name}.docx`);
}

/* ── PDF from slides canvas ── */
async function saveSlidesPdf(name: string, slides: Slide[]) {
  // Build a hidden off-screen container with all slides rendered as DOM
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;';
  document.body.appendChild(container);

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [960, 540] });

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideEl = document.createElement('div');
    slideEl.style.cssText = `width:960px;height:540px;position:relative;background:${slide.background || '#fff'};overflow:hidden;`;

    slide.elements.forEach(el => {
      const div = document.createElement('div');
      div.style.cssText = [
        'position:absolute',
        `left:${(el.x / 960) * 100}%`,
        `top:${(el.y / 540) * 100}%`,
        `width:${(el.width / 960) * 100}%`,
        `height:${(el.height / 540) * 100}%`,
        'overflow:hidden',
        ...(el.style ? Object.entries(el.style).map(([k, v]) =>
          `${k.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`)}:${v}`
        ) : []),
      ].join(';');
      if (el.type === 'text') {
        div.textContent = el.content;
      } else if (el.type === 'rectangle') {
        div.style.background = el.style?.fill || '#3B82F6';
        div.style.borderRadius = '3px';
      } else if (el.type === 'circle') {
        div.style.background = el.style?.fill || '#3B82F6';
        div.style.borderRadius = '50%';
      }
      slideEl.appendChild(div);
    });

    container.innerHTML = '';
    container.appendChild(slideEl);

    // Wait for fonts/layout
    await new Promise(r => setTimeout(r, 60));

    const canvas = await html2canvas(slideEl, {
      width: 960, height: 540, scale: 1.5,
      useCORS: true, backgroundColor: slide.background || '#fff',
    });

    if (i > 0) pdf.addPage([960, 540], 'landscape');
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 960, 540);
  }

  document.body.removeChild(container);
  pdf.save(`${name}.pdf`);
}

/* ── public API ── */
export async function downloadFile(
  name: string,
  content: string,
  format: SaveFormat,
  type: 'document' | 'slides' | 'ide',
  slidesData?: Slide[]
) {
  if (format === 'docx') {
    await saveDocx(name, content);
    return;
  }

  if (format === 'pdf' && slidesData) {
    await saveSlidesPdf(name, slidesData);
    return;
  }

  if (format === 'skhop') {
    const payload = { version: '1.0', type: 'slides', name, createdAt: new Date().toISOString(), slides: slidesData };
    triggerDownload(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `${name}.skhop`
    );
    return;
  }

  // .skho generic
  const payload = { version: '1.0', type, name, createdAt: new Date().toISOString(), content };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `${name}.skho`
  );
}
