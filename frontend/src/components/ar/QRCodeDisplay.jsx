import React, { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Download, ArrowUpRight } from 'lucide-react';

// Helper function to detect mobile devices
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const QRCodeDisplay = React.memo(({ 
  flowerType = 'rose', 
  color = '#ff69b4',
  className = ''
}) => {
  const [showCopied, setShowCopied] = useState(false);
  
  // Generate AR view URL with current configuration
  const generateARUrl = useCallback(() => {
    const url = new URL(window.location.origin + '/view-ar');
    url.searchParams.set('type', encodeURIComponent(flowerType));
    url.searchParams.set('color', encodeURIComponent(color.replace('#', '')));
    url.searchParams.set('ar', 'true');
    return url.toString();
  }, [flowerType, color]);
  
  const arUrl = generateARUrl();
  
  // Auto-hide copied message after 2 seconds
  useEffect(() => {
    if (showCopied) {
      const timer = setTimeout(() => setShowCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopied]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(arUrl);
      } else {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = arUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setShowCopied(true);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [arUrl]);

  // Handle download QR code as SVG
  const handleDownload = useCallback(() => {
    try {
      const svg = document.querySelector('.qr-code svg');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ar-flower-${flowerType}-${color.replace('#', '')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  }, [flowerType, color]);

  return (
    <div className={`flex flex-col items-center p-6 bg-white rounded-xl shadow-xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="relative p-4 mb-4 bg-white rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
        <QRCodeSVG 
          value={arUrl} 
          size={200}
          level="H"
          includeMargin={false}
          className="qr-code"
          imageSettings={{
            src: '/favicon.ico',
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
        
        {/* Center dot overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
          </div>
        </div>
      </div>
      
      <div className="w-full space-y-3">
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              readOnly
              value={arUrl}
              className="w-full px-4 py-2 pr-10 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 truncate"
            />
            <button
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {showCopied && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Link copied!
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <a
            href={arUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-md text-sm font-medium transition-all transform hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            {isMobile() ? 'Open in AR' : 'View on Mobile'}
            <ArrowUpRight className="w-3.5 h-3.5 ml-1.5 opacity-80" />
          </a>
          
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Scan the QR code or tap the button above
          {!isMobile() && ' on your mobile device'}
          {isMobile() && ' to view in AR'}
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => (
  // Only re-render if flowerType or color changes
  prevProps.flowerType === nextProps.flowerType && 
  prevProps.color === nextProps.color &&
  prevProps.className === nextProps.className
));

QRCodeDisplay.displayName = 'QRCodeDisplay';

export default QRCodeDisplay;