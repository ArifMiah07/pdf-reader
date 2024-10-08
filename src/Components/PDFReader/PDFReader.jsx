import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, } from 'lucide-react';
import './PDFReader.css'

const PDFReader = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [pdfDoc, setPdfDoc] = useState(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pageNumber, scale, pdfDoc]);

  const onFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target.result);
        const loadingTask = window.pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNumber(1);
      };
      fileReader.readAsArrayBuffer(file);
    }
  };

  const renderPage = async () => {
    if (pdfDoc) {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;

      // Text layer
      const textContent = await page.getTextContent();
      const textLayer = textLayerRef.current;
      textLayer.innerHTML = '';
      textLayer.style.left = canvas.offsetLeft + 'px';
      textLayer.style.top = canvas.offsetTop + 'px';
      textLayer.style.height = canvas.height + 'px';
      textLayer.style.width = canvas.width + 'px';

      window.pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: [],
      });
    }
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <input
          type="file"
          onChange={onFileChange}
          className="mb-4"
          accept=".pdf"
        />
        <div className="relative">
          <canvas ref={canvasRef} className="border border-gray-300" />
          <div ref={textLayerRef} className="absolute top-0 left-0 text-layer" />
        </div>
        {pdfDoc && (
          <>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={previousPage}
                disabled={pageNumber <= 1}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                <ChevronLeft size={24} />
              </button>
              <p>
                Page {pageNumber} of {numPages}
              </p>
              <button
                onClick={nextPage}
                disabled={pageNumber >= numPages}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              >
                <ZoomOut size={24} />
              </button>
              <button
                onClick={() => setScale((s) => s + 0.1)}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                <ZoomIn size={24} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PDFReader;