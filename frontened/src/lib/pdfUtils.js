import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captures a DOM element and returns a PDF Blob.
 * 
 * @param {string} elementId - The ID of the DOM element to capture.
 * @param {string} filename - The desired filename.
 * @returns {Promise<{ blob: Blob, filename: string }>} - A promise that resolves to the PDF Blob and filename.
 */
export const generatePDFBlob = async (elementId, filename = 'prescription.pdf') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  try {
    // Clone the element to manipulate it without affecting the actual DOM
    const clone = element.cloneNode(true);
    
    // Add temporary container to document to render properly
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm'; // A4 width
    // container.style.height = '297mm'; // A4 height (auto height usually better for content)
    container.style.padding = '20px'; // Give standard padding
    
    // Fix scaling issues typically present when styling uses transforms
    clone.style.transform = 'none';
    
    container.appendChild(clone);
    document.body.appendChild(container);

    // Wait for images to load (optional but recommended)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture canvas
    const canvas = await html2canvas(clone, {
      scale: 2, // High resolution
      useCORS: true, 
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Clean up
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Create PDF (A4 size: 210x297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Return as Blob
    const blob = pdf.output('blob');
    return { blob, filename };
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
