export const printElement = (elementId, title = '') => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        console.error(`Element with id ${elementId} not found for printing.`);
        return;
    }

    const originalRoot = document.getElementById('root');
    const originalTitle = document.title;
    
    // Set title for default filename during "Save as PDF"
    document.title = title || 'CareConnect';

    const printClone = printContent.cloneNode(true);
    
    // Inject print-specific styles to suppress browser headers/footers
    // Setting margins to 0mm is the primary way to hide browser-generated title/date
    const style = document.createElement('style');
    style.innerHTML = `
        @page { 
            size: A4; 
            margin: 0mm !important; 
        }
        @media print {
            body { 
                margin: 0 !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            .font-print-hide { 
                display: none !important; 
            }
            #root { 
                display: none !important; 
            }
        }
    `;
    printClone.appendChild(style);

    // We want the printed document to be full scale A4, so we remove any tailwind scale classes that might have been applied to parent containers.
    printClone.className = printClone.className
        .replace(/scale-\[[^\]]+\]/g, '')
        .replace(/lg:scale-\d+/g, '')
        .replace(/xl:scale-\[[^\]]+\]/g, '')
        .replace(/shadow-2xl/g, ''); // Remove shadow for print

    // Force absolute positioning and A4 dimensions for the clone
    printClone.style.position = 'absolute';
    printClone.style.left = '0';
    printClone.style.top = '0';
    printClone.style.width = '210mm';
    printClone.style.minHeight = '297mm';
    printClone.style.backgroundColor = 'white';
    printClone.style.zIndex = '999999';
    printClone.style.margin = '0';
    
    document.body.appendChild(printClone);
    
    if (originalRoot) {
        originalRoot.style.display = 'none';
    }
    
    window.print();
    
    // Cleanup
    document.body.removeChild(printClone);
    if (originalRoot) {
        originalRoot.style.display = '';
    }
    document.title = originalTitle;
};



