import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, Bookmark, 
  Highlighter, MessageCircle, Download, Printer, Lock, Globe, Moon, Sun
} from 'lucide-react';

import './PDFReader.css';

const PDFReader = () => {
  const [pdfDocs, setPdfDocs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [comments, setComments] = useState([]);
  const [language, setLanguage] = useState('en');
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const containerRef = useRef(null);

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
    if (pdfDocs[activeTabIndex]) {
      renderPage();
    }
  }, [pageNumber, scale, activeTabIndex, pdfDocs]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (pdfDocs[activeTabIndex]) {
        renderPage();
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [pdfDocs, activeTabIndex]);

  const onFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target.result);
        const loadingTask = window.pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        setPdfDocs(prev => [...prev, { doc: pdf, name: file.name }]);
        setActiveTabIndex(pdfDocs.length);
        setPageNumber(1);
      };
      fileReader.readAsArrayBuffer(file);
    }
  };

  const renderPage = async () => {
    if (pdfDocs[activeTabIndex]) {
      const page = await pdfDocs[activeTabIndex].doc.getPage(pageNumber);
      const containerWidth = containerRef.current.clientWidth;
      const viewport = page.getViewport({ scale: 1 });
      const scaledViewport = page.getViewport({ scale: containerWidth / viewport.width });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      canvas.style.width = `${scaledViewport.width}px`;
      canvas.style.height = `${scaledViewport.height}px`;

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      await page.render(renderContext).promise;

      renderTextLayer(page, scaledViewport);
    }
  };

  const renderTextLayer = async (page, viewport) => {
    const textContent = await page.getTextContent();
    const textLayer = textLayerRef.current;
    textLayer.innerHTML = '';
    textLayer.style.left = canvasRef.current.offsetLeft + 'px';
    textLayer.style.top = canvasRef.current.offsetTop + 'px';
    textLayer.style.height = canvasRef.current.height + 'px';
    textLayer.style.width = canvasRef.current.width + 'px';

    window.pdfjsLib.renderTextLayer({
      textContent: textContent,
      container: textLayer,
      viewport: viewport,
      textDivs: [],
    });
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const toggleHighlighting = () => {
    setIsHighlighting(!isHighlighting);
  };

  const handleTextLayerClick = (e) => {
    if (isHighlighting) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = 'yellow';
      range.surroundContents(span);
      selection.removeAllRanges();
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSearch = () => {
    // Implement PDF search functionality
    console.log('Searching for:', searchQuery);
  };

  const addBookmark = () => {
    setBookmarks(prev => [...prev, { page: pageNumber, text: `Bookmark on page ${pageNumber}` }]);
  };

  const addComment = () => {
    const commentText = prompt('Enter your comment:');
    if (commentText) {
      setComments(prev => [...prev, { page: pageNumber, text: commentText }]);
    }
  };

  const exportPDF = () => {
    // Implement PDF export functionality
    console.log('Exporting PDF');
  };

  const printPDF = () => {
    // Implement PDF printing functionality
    console.log('Printing PDF');
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    // Implement language change logic
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
      <div ref={containerRef} className={`p-4 rounded-lg shadow-md w-full max-w-4xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
        <input type="file" onChange={onFileChange} className="mb-4 w-full" accept=".pdf" />
        
        {/* Tabs for multiple PDFs */}
        <div className="flex mb-4 overflow-x-auto">
          {pdfDocs.map((doc, index) => (
            <button
              key={index}
              onClick={() => setActiveTabIndex(index)}
              className={`px-4 py-2 mr-2 rounded-t-lg ${activeTabIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {doc.name}
            </button>
          ))}
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} w-full`} />
          <div 
            ref={textLayerRef} 
            className="absolute top-0 left-0 text-layer"
            onClick={handleTextLayerClick}
          />
        </div>

        {pdfDocs[activeTabIndex] && (
          <>
            <div className="flex flex-wrap justify-between items-center mt-4">
              <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="btn">
                <ChevronLeft size={20} />
              </button>
              <p>Page {pageNumber} of {pdfDocs[activeTabIndex].doc.numPages}</p>
              <button onClick={() => changePage(1)} disabled={pageNumber >= pdfDocs[activeTabIndex].doc.numPages} className="btn">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex flex-wrap justify-center mt-4 space-x-2">
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="btn"><ZoomOut size={20} /></button>
              <button onClick={() => setScale(s => s + 0.1)} className="btn"><ZoomIn size={20} /></button>
              <button onClick={toggleHighlighting} className={`btn ${isHighlighting ? 'bg-yellow-500' : ''}`}><Highlighter size={20} /></button>
              <button onClick={addBookmark} className="btn"><Bookmark size={20} /></button>
              <button onClick={addComment} className="btn"><MessageCircle size={20} /></button>
              <button onClick={exportPDF} className="btn"><Download size={20} /></button>
              <button onClick={printPDF} className="btn"><Printer size={20} /></button>
              <button onClick={toggleDarkMode} className="btn">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            </div>

            <div className="mt-4 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PDF..."
                className="flex-grow px-2 py-1 border rounded"
              />
              <button onClick={handleSearch} className="btn ml-2"><Search size={20} /></button>
            </div>

            {/* Language selector (placeholder) */}
            <select onChange={(e) => changeLanguage(e.target.value)} value={language} className="mt-4">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>

            {/* Bookmarks and Comments lists */}
            <div className="mt-4">
              <h3>Bookmarks</h3>
              <ul>
                {bookmarks.map((bookmark, index) => (
                  <li key={index}>{bookmark.text}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h3>Comments</h3>
              <ul>
                {comments.map((comment, index) => (
                  <li key={index}>{comment.text}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PDFReader;