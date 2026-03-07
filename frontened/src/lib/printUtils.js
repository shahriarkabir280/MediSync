export const printElement = (elementId) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) {
        console.error(`Element with id ${elementId} not found for printing.`);
        return;
    }

    const originalRoot = document.getElementById('root');
    const printClone = printContent.cloneNode(true);
    
    // We want the printed document to be full scale A4, so we remove any tailwind scale classes that might have been applied to parent containers.
    // However, if the element itself has them, remove them:
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
    printClone.style.backgroundColor = 'white';
    printClone.style.zIndex = '999999';
    printClone.style.margin = '0';
    
    // Some browsers print better when the element is just appended to the body
    document.body.appendChild(printClone);
    
    // Hide the actual React application
    if (originalRoot) {
        originalRoot.style.display = 'none';
    }
    
    window.print();
    
    // Cleanup afterwards
    document.body.removeChild(printClone);
    if (originalRoot) {
        originalRoot.style.display = '';
    }
};
