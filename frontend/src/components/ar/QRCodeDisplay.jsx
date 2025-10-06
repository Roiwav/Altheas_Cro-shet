// components/ar/QRCodeDisplay.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Smartphone, Download, ArrowUpRight } from 'lucide-react';

const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

const QRCodeDisplay = React.memo(
  ({ flowerType = 'rose', color = '#ff69b4', arrangement = 'single', className = '' }) => {
    const [showCopied, setShowCopied] = useState(false);

    const generateARUrl = useCallback(() => {
      const url = new URL(window.location.origin + '/view-ar');
      url.searchParams.set('type', encodeURIComponent(flowerType));
      url.searchParams.set('arrangement', encodeURIComponent(arrangement));
      url.searchParams.set('color', encodeURIComponent(color.replace('#', '')));
      url.searchParams.set('ar', 'true');
      return url.toString();
    }, [flowerType, color, arrangement]);

    const arUrl = generateARUrl();

    useEffect(() => {
      if (!showCopied) return;
      const timer = setTimeout(() => setShowCopied(false), 2000);
      return () => clearTimeout(timer);
    }, [showCopied]);

    const handleCopy = useCallback(async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(arUrl);
        } else {
          const input = document.createElement('input');
          input.value = arUrl;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
        }
        setShowCopied(true);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }, [arUrl]);

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
      } catch (err) {
        console.error('Error downloading QR code:', err);
      }
    }, [flowerType, color]);

    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {isMobile() && (
          <a
            href={arUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full max-w-xs px-4 py-3 mb-6 font-medium text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hover:shadow-lg"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Tap to View in Your Space
            <ArrowUpRight className="w-5 h-5 ml-1" />
          </a>
        )}

        <div className="relative p-4 bg-white border border-gray-200 qr-code rounded-xl dark:bg-gray-900/50 dark:border-gray-700">
          <QRCodeSVG
            value={arUrl}
            size={220}
            bgColor="transparent"
            fgColor={document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'}
            level="Q"
            includeMargin={false}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 border border-transparent rounded-lg dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {showCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span>{showCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 border border-transparent rounded-lg dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Download className="w-4 h-4" />
            <span>Download SVG</span>
          </button>
        </div>
      </div>
    );
  }
);

QRCodeDisplay.displayName = 'QRCodeDisplay';
export default QRCodeDisplay;
