import { PDFDocument, rgb, PageSizes } from 'pdf-lib';
import type { ImageFile, ConversionOptions, PageSize } from '../types';

const PAGE_SIZES: Record<string, PageSize> = {
  A4: { width: 595, height: 842 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
};

const QUALITY_SETTINGS = {
  high: 0.9,
  medium: 0.7,
  low: 0.5,
};

export async function generatePDF(
  images: ImageFile[],
  options: ConversionOptions,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const pageSize = PAGE_SIZES[options.pageSize];
  const { width: pageWidth, height: pageHeight } = options.orientation === 'landscape'
    ? { width: pageSize.height, height: pageSize.width }
    : pageSize;

  const margin = options.margin;
  const availableWidth = pageWidth - (margin * 2);
  const availableHeight = pageHeight - (margin * 2);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let imagesOnCurrentPage = 0;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Update progress
    if (onProgress) {
      onProgress((i / images.length) * 100);
    }

    try {
      // Convert image to appropriate format for pdf-lib
      const imageBytes = await fileToArrayBuffer(image.file);
      let embeddedImage;

      // Determine image type and embed accordingly
      if (image.file.type.includes('png')) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (image.file.type.includes('jpg') || image.file.type.includes('jpeg')) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        // For other formats, convert to canvas and then to JPEG
        const canvas = await imageToCanvas(image.file);
        const jpegBytes = canvasToJpeg(canvas, QUALITY_SETTINGS[options.quality]);
        embeddedImage = await pdfDoc.embedJpg(jpegBytes);
      }

      // Calculate image dimensions and position
      const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1);
      const { scaledWidth, scaledHeight, x, y } = calculateImageDimensions(
        imgWidth,
        imgHeight,
        availableWidth,
        availableHeight,
        options.imagesPerPage,
        imagesOnCurrentPage,
        margin,
        pageWidth,
        pageHeight
      );

      // Draw the image
      currentPage.drawImage(embeddedImage, {
        x,
        y: pageHeight - y - scaledHeight, // Flip Y coordinate
        width: scaledWidth,
        height: scaledHeight,
      });

      imagesOnCurrentPage++;

      // Check if we need a new page
      if (imagesOnCurrentPage >= options.imagesPerPage && i < images.length - 1) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        imagesOnCurrentPage = 0;
      }
    } catch (error) {
      console.error(`Failed to process image ${image.name}:`, error);
      // Continue with the next image instead of failing completely
    }
  }

  if (onProgress) {
    onProgress(100);
  }

  return await pdfDoc.save();
}

function calculateImageDimensions(
  imgWidth: number,
  imgHeight: number,
  availableWidth: number,
  availableHeight: number,
  imagesPerPage: number,
  imageIndex: number,
  margin: number,
  pageWidth: number,
  pageHeight: number
): { scaledWidth: number; scaledHeight: number; x: number; y: number } {
  let scaledWidth: number;
  let scaledHeight: number;
  let x: number;
  let y: number;

  if (imagesPerPage === 1) {
    // Single image per page - fit to available space
    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    scaledWidth = imgWidth * scale;
    scaledHeight = imgHeight * scale;
    x = margin + (availableWidth - scaledWidth) / 2;
    y = margin + (availableHeight - scaledHeight) / 2;
  } else if (imagesPerPage === 2) {
    // Two images per page - side by side
    const imageAreaWidth = availableWidth / 2 - 10; // 10px gap between images
    const scale = Math.min(imageAreaWidth / imgWidth, availableHeight / imgHeight);
    scaledWidth = imgWidth * scale;
    scaledHeight = imgHeight * scale;
    
    x = margin + (imageIndex % 2) * (availableWidth / 2) + (imageAreaWidth - scaledWidth) / 2;
    y = margin + (availableHeight - scaledHeight) / 2;
  } else if (imagesPerPage === 4) {
    // Four images per page - 2x2 grid
    const imageAreaWidth = availableWidth / 2 - 10;
    const imageAreaHeight = availableHeight / 2 - 10;
    const scale = Math.min(imageAreaWidth / imgWidth, imageAreaHeight / imgHeight);
    scaledWidth = imgWidth * scale;
    scaledHeight = imgHeight * scale;
    
    const col = imageIndex % 2;
    const row = Math.floor(imageIndex / 2) % 2;
    
    x = margin + col * (availableWidth / 2) + (imageAreaWidth - scaledWidth) / 2;
    y = margin + row * (availableHeight / 2) + (imageAreaHeight - scaledHeight) / 2;
  } else {
    // Default to single image layout
    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    scaledWidth = imgWidth * scale;
    scaledHeight = imgHeight * scale;
    x = margin + (availableWidth - scaledWidth) / 2;
    y = margin + (availableHeight - scaledHeight) / 2;
  }

  return { scaledWidth, scaledHeight, x, y };
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): ArrayBuffer {
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}