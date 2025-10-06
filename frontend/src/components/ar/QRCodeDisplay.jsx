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
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <a
            href={arUrl}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-black rounded-lg"
          >
            <Smartphone className="w-4 h-4" />
            Open on mobile
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid w-full my-4 qr-code place-items-center">
          <QRCodeSVG value={arUrl} size={220} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded"
          >
            {showCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {showCopied ? 'Copied' : 'Copy link'}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded"
          >
            <Download className="w-4 h-4" />
            Download QR
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-600">
          Scan the QR code or tap the button above {isMobile() ? 'to view in AR' : 'on a mobile device'}.
        </p>
      </div>
    );
  }
);

QRCodeDisplay.displayName = 'QRCodeDisplay';
export default QRCodeDisplay;
