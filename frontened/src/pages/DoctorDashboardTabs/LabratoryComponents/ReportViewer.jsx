import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  Pencil,
  Save,
  Loader2,
  Eraser,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { labApi } from '../../../lib/api';
import { getImageUrl } from '../../../config/api';

// Import styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Bundle the pdf.js worker locally (matches the installed pdfjs-dist version exactly)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;

const ReportViewer = ({ pdfUrl, orderId, onSaveSuccess, onClose }) => {
    const [activeTool, setActiveTool] = useState('pencil'); // 'pencil', 'eraser', 'none'
    const [currentColor, setCurrentColor] = useState('#EF4444'); // Default Red for medical
    const [saving, setSaving] = useState(false);
    const [paths, setPaths] = useState({}); // { [pageNum]: [ { points: [], color, width } ] }
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPdfUrl, setCurrentPdfUrl] = useState(pdfUrl);
    const [viewerKey, setViewerKey] = useState(0); // For forcing remount after save
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.1);
    const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

    const generateAnnotatedPdf = async () => {
        const response = await fetch(pdfUrl);
        const existingPdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return rgb(r, g, b);
        };

        for (const pageNumStr in paths) {
            const pageIndex = parseInt(pageNumStr);
            const pagePaths = paths[pageIndex];
            if (!pagePaths || pagePaths.length === 0) continue;

            const page = pdfDoc.getPage(pageIndex);
            const { width, height } = page.getSize();

            pagePaths.forEach(path => {
                for (let i = 0; i < path.points.length - 1; i++) {
                    const p1 = path.points[i];
                    const p2 = path.points[i + 1];
                    page.drawLine({
                        start: { x: p1.x * width, y: height - (p1.y * height) },
                        end: { x: p2.x * width, y: height - (p2.y * height) },
                        thickness: path.width || 2,
                        color: hexToRgb(path.color || '#EF4444'),
                        opacity: 1,
                    });
                }
            });
        }
        return await pdfDoc.save();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const pdfBytes = await generateAnnotatedPdf();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const formData = new FormData();
            formData.append('file', blob, `annotated_report_${orderId}.pdf`);

            const result = await labApi.updateReportFile(orderId, formData);
            if (result.success) {
                toast.success('Report saved successfully');
                // Instant load: Clear current drawings and reload viewer with new URL
                setPaths({}); // Clear local annotations since they are now in the PDF
                const newUrl = `${getImageUrl(result.data.file_path)}?t=${new Date().getTime()}`;
                setCurrentPdfUrl(newUrl);
                setPageNumber(1);
                setViewerKey(prev => prev + 1); // Force Viewer to remount and load new file

                if (onSaveSuccess) onSaveSuccess(result.data);
            }
        } catch (error) {
            console.error('Error saving PDF:', error);
            toast.error('Failed to save annotated report');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        try {
            toast.loading('Preparing download...', { id: 'download-pdf' });
            const pdfBytes = await generateAnnotatedPdf();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Medical_Report_${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Download started', { id: 'download-pdf' });
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to generate download', { id: 'download-pdf' });
        }
    };

    const onDocumentLoadSuccess = ({ numPages: loadedNumPages }) => {
        setNumPages(loadedNumPages);
        setPageNumber(1);
    };

    const onPageRenderSuccess = (page) => {
        const viewport = page.getViewport({ scale });
        setPageSize({ width: viewport.width, height: viewport.height });
    };

    const goToPrevPage = () => setPageNumber(p => Math.max(1, p - 1));
    const goToNextPage = () => setPageNumber(p => Math.min(numPages || 1, p + 1));
    const zoomIn = () => setScale(s => Math.min(MAX_SCALE, +(s + 0.2).toFixed(2)));
    const zoomOut = () => setScale(s => Math.max(MIN_SCALE, +(s - 0.2).toFixed(2)));

    const pageIndex = pageNumber - 1;

    const startDrawing = (e) => {
        setIsDrawing(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        setPaths(prev => {
            const pagePaths = prev[pageIndex] || [];
            return {
                ...prev,
                [pageIndex]: [...pagePaths, {
                    points: [{ x: mouseX, y: mouseY }],
                    color: currentColor,
                    width: 2
                }]
            };
        });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setPaths(prev => {
            const currentPagePaths = [...(prev[pageIndex] || [])];
            const lastPath = { ...currentPagePaths[currentPagePaths.length - 1] };
            lastPath.points = [...lastPath.points, { x, y }];
            currentPagePaths[currentPagePaths.length - 1] = lastPath;
            return { ...prev, [pageIndex]: currentPagePaths };
        });
    };

    const startErasing = (e) => {
        setIsDrawing(true);
        erase(e);
    };

    const erase = (e) => {
        if (!isDrawing) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        setPaths(prev => {
            const pagePaths = prev[pageIndex] || [];
            // Remove any path where at least one point is within range of mouse
            const newPagePaths = pagePaths.filter(path => {
                return !path.points.some(p => {
                    const dist = Math.sqrt(Math.pow(p.x - mouseX, 2) + Math.pow(p.y - mouseY, 2));
                    return dist < 0.02; // Eraser radius
                });
            });

            if (newPagePaths.length === pagePaths.length) return prev;
            return { ...prev, [pageIndex]: newPagePaths };
        });
    };

    const stopInteraction = () => {
        setIsDrawing(false);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-200 dark:bg-slate-950/40 relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between w-full px-4 h-14 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                        <input
                            type="number"
                            min={1}
                            max={numPages || 1}
                            value={pageNumber}
                            onChange={(e) => {
                                const val = Math.max(1, Math.min(numPages || 1, Number(e.target.value) || 1));
                                setPageNumber(val);
                            }}
                            className="w-8 text-center bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">of</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{numPages || '-'}</span>
                    </div>
                    <button
                        onClick={goToNextPage}
                        disabled={!numPages || pageNumber >= numPages}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                    <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800">
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <div className="min-w-[60px] text-center text-[10px] font-bold text-slate-600 dark:text-slate-300">{Math.round(scale * 100)}%</div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                    <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white dark:hover:bg-slate-800">
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 ml-4">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 mr-1">
                        <button
                            onClick={() => setActiveTool(activeTool === 'pencil' ? 'none' : 'pencil')}
                            title={activeTool === 'pencil' ? "Pencil Active" : "Pencil Tool"}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                                activeTool === 'pencil'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {activeTool === 'pencil' && (
                            <div className="flex items-center gap-1 pl-1 ml-1 border-l border-slate-200 dark:border-slate-700">
                                {[
                                    { id: 'red', value: '#EF4444' }, // Rose 500
                                    { id: 'blue', value: '#3B82F6' }, // Blue 500
                                    { id: 'green', value: '#10B981' }, // Emerald 500
                                    { id: 'black', value: '#0F172A' }, // Slate 900
                                ].map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => setCurrentColor(color.value)}
                                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                                            currentColor === color.value
                                                ? 'border-indigo-600 scale-110 shadow-sm'
                                                : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={`${color.id} ink`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser')}
                        title={activeTool === 'eraser' ? "Eraser Active" : "Eraser Tool"}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                            activeTool === 'eraser'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Eraser className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        title="Save annotated report"
                        className={`transition-all duration-200 transform ${
                            saving
                                ? 'text-indigo-600 scale-125'
                                : 'text-slate-400 hover:text-indigo-600 hover:scale-110'
                        }`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={handleDownload}
                        title="Download report with annotations"
                        className="text-slate-400 hover:text-indigo-600 transition-all duration-200 transform hover:scale-110"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Document */}
            <div className="flex-1 overflow-auto flex items-start justify-center py-6">
                <Document
                    key={viewerKey}
                    file={currentPdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<Loader2 className="w-6 h-6 animate-spin text-indigo-500 mt-10" />}
                >
                    <div
                        className="relative shadow-xl bg-white"
                        style={{ width: pageSize.width || undefined, height: pageSize.height || undefined }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            onRenderSuccess={onPageRenderSuccess}
                            renderAnnotationLayer
                            renderTextLayer
                        />

                        {activeTool !== 'none' && pageSize.width > 0 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: pageSize.width,
                                    height: pageSize.height,
                                    zIndex: 10,
                                    cursor: activeTool === 'pencil'
                                        ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Ccircle cx=\'6\' cy=\'6\' r=\'2\' fill=\'black\'/%3E%3C/svg%3E") 6 6, crosshair'
                                        : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m20 20-2 2h4\'/%3E%3Cpath d=\'M4 20 2 22h4\'/%3E%3Cpath d=\'M22 10.3c0-.6-.2-1.2-.6-1.6l-5.7-5.7c-.4-.4-1-.6-1.6-.6s-1.2.2-1.6.6L2.9 12.6c-.9.9-.9 2.3 0 3.2l3.3 3.3c.4.4 1 .6 1.6.6h11.4c.6 0 1.2-.2 1.6-.6l.7-.7c.4-.4.5-1 .5-1.5Z\'/%3E%3Cpath d=\'m12.5 15 5-5\'/%3E%3C/svg%3E") 12 12, auto',
                                    touchAction: 'none'
                                }}
                                onMouseDown={(e) => activeTool === 'pencil' ? startDrawing(e) : startErasing(e)}
                                onMouseMove={(e) => activeTool === 'pencil' ? draw(e) : erase(e)}
                                onMouseUp={stopInteraction}
                                onMouseLeave={stopInteraction}
                            >
                                <canvas
                                    width={pageSize.width}
                                    height={pageSize.height}
                                    style={{ width: '100%', height: '100%' }}
                                    ref={(el) => {
                                        if (el) {
                                            const ctx = el.getContext('2d');
                                            ctx.clearRect(0, 0, el.width, el.height);
                                            const pagePaths = paths[pageIndex] || [];
                                            pagePaths.forEach(path => {
                                                if (path.points.length < 2) return;
                                                ctx.beginPath();
                                                ctx.strokeStyle = path.color;
                                                ctx.lineWidth = path.width;
                                                ctx.lineCap = 'round';
                                                ctx.moveTo(path.points[0].x * el.width, path.points[0].y * el.height);
                                                for (let i = 1; i < path.points.length; i++) {
                                                    ctx.lineTo(path.points[i].x * el.width, path.points[i].y * el.height);
                                                }
                                                ctx.stroke();
                                            });
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </Document>
            </div>

            {/* Floating Tools Status */}
            {activeTool !== 'none' && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 text-white rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl border border-white/10 z-50">
                    {activeTool === 'pencil' ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Pencil Tool Active
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Eraser Tool Active
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportViewer;
