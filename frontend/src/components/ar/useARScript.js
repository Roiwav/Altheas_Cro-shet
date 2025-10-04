import { useState, useEffect } from 'react';

const AR_SCRIPT_URL = 'https://raw.githack.com/AR-js-org/AR.js/master/three.js/build/ar.js';

let arScriptLoaded = false;
let arScriptLoading = false;
const subscribers = new Set();

export function useARScript() {
  const [isLoaded, setIsLoaded] = useState(arScriptLoaded);

  useEffect(() => {
    if (arScriptLoaded) {
      return;
    }

    subscribers.add(setIsLoaded);

    if (!arScriptLoading) {
      arScriptLoading = true;
      const script = document.createElement('script');
      script.src = AR_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        arScriptLoaded = true;
        arScriptLoading = false;
        subscribers.forEach(subscriber => subscriber(true));
        subscribers.clear();
      };
      document.body.appendChild(script);
    }

    return () => {
      subscribers.delete(setIsLoaded);
    };
  }, []);

  return isLoaded;
}

