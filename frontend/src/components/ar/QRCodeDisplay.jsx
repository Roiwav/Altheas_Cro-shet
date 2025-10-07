import React, { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Download, ArrowUpRight } from 'lucide-react';

// Helper function to detect mobile devices based on the user agent string.
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * A component that generates and displays a QR code for the AR experience.
 * It also provides actions like copying the AR link, downloading the QR code,
 * and opening the AR link directly on mobile devices.
 * It's memoized to prevent re-renders unless its props change.
 */
const QRCodeDisplay = React.memo(({ 
  flowerType = 'rose', 
  color = '#ff69b4',
  arrangement = 'single',
  className = ''
}) => {
  // State to manage the visibility of the "Copied!" confirmation message.
  const [showCopied, setShowCopied] = useState(false);
  
  // Memoized function to generate the AR view URL based on the current flower configuration.
  const generateARUrl = useCallback(() => {
    // The target URL for the AR experience page.
    const url = new URL(window.location.origin + '/view-ar');
    // Append configuration as URL search parameters.
    url.searchParams.set('type', encodeURIComponent(flowerType));
    url.searchParams.set('arrangement', encodeURIComponent(arrangement));
    url.searchParams.set('color', encodeURIComponent(color.replace('#', '')));
    url.searchParams.set('ar', 'true');
    return url.toString();
  }, [flowerType, color, arrangement]);
  
  // Generate the URL to be used in the QR code and links.
  const arUrl = generateARUrl();
  
  // Effect to automatically hide the "Copied!" message after 2 seconds.
  useEffect(() => {
    if (showCopied) {
      const timer = setTimeout(() => setShowCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopied]);

  // Memoized function to handle copying the AR URL to the clipboard.
  const handleCopy = useCallback(async () => {
    try {
      // Use the modern Clipboard API if available.
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(arUrl);
      } else {
        // Fallback for older browsers using the deprecated `document.execCommand('copy')`.
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

  // Memoized function to handle downloading the QR code as an SVG file.
  const handleDownload = useCallback(() => {
    try {
      // Find the SVG element within the component.
      const svg = document.querySelector('.qr-code svg');
      if (!svg) return;
      
      // Serialize the SVG to a string and create a Blob.
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Create a temporary link element to trigger the download.
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
      {/* QR Code visual container */}
      <div className="relative p-4 mb-4 bg-white border border-gray-100 rounded-lg shadow-sm dark:border-gray-700">
        <QRCodeSVG 
          value={arUrl} 
          size={200}
          level="H"
          includeMargin={false}
          className="qr-code"
          // Embeds a small icon in the center of the QR code.
          imageSettings={{
            src: '/favicon.ico',
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
        
        {/* A decorative overlay in the center of the QR code icon. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full dark:bg-gray-800">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Container for action buttons and URL display. */}
      <div className="w-full space-y-3">
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              readOnly
              value={arUrl}
              className="w-full px-4 py-2 pr-10 text-sm text-gray-700 truncate border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
            <button
              onClick={handleCopy}
              className="absolute p-1 text-gray-400 transition-colors -translate-y-1/2 right-2 top-1/2 hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {/* Tooltip that appears when the link is copied. */}
          {showCopied && (
            <div className="absolute px-2 py-1 text-xs text-white -translate-x-1/2 bg-gray-800 rounded -top-8 left-1/2 whitespace-nowrap">
              Link copied!
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          {/* Direct link to open the AR experience, most useful on mobile. */}
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
          
          {/* Button to download the QR code as an SVG file. */}
          <button
            onClick={handleDownload}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </button>
        </div>
        
        {/* Instructional text for the user. */}
        <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          Scan the QR code or tap the button above
          {!isMobile() && ' on your mobile device'}
          {isMobile() && ' to view in AR'}
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => (
  // Custom comparison function for React.memo to prevent unnecessary re-renders.
  prevProps.flowerType === nextProps.flowerType && 
  prevProps.color === nextProps.color &&
  prevProps.className === nextProps.className &&
  prevProps.arrangement === nextProps.arrangement
));

QRCodeDisplay.displayName = 'QRCodeDisplay';

export default QRCodeDisplay;