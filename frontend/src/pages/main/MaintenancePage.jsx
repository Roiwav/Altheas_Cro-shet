import { Wrench } from 'lucide-react';
import { useMemo } from 'react';
import useBubbles from '../../hooks/useBubbles';

export default function MaintenancePage() {
  const bubbleOptions = useMemo(
    () => ({
      count: 20,
      sizeRange: [8, 18],
      durationRange: [12, 22],
      opacity: 0.1,
      colors: ['#ec4899', '#8b5cf6'],
    }),
    []
  );

  useBubbles('maintenance-container', bubbleOptions);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden text-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 maintenance-container">
      <div className="relative z-10 w-full max-w-lg p-8 overflow-hidden border shadow-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-white shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl">
          <Wrench className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-transparent text-gray-900 md:text-5xl dark:text-white bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
          Under Maintenance
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Our little corner of the internet is getting a bit of TLC.
          <br />
          Althea's Cro-shet will be back shortly, prettier than ever!
        </p>
      </div>
    </div>
  );
}