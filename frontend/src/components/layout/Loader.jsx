import React from 'react';
import { motion as MOTION } from 'framer-motion';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center z-50">
      <div className="relative">
        {/* Animated gradient background */}
        <MOTION.div 
          className="absolute inset-0 rounded-full blur-xl opacity-20"
          style={{
            background: 'linear-gradient(45deg, #ec4899, #8b5cf6, #ec4899)',
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Gradient text */}
        <MOTION.div
          className="relative z-10 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            transition: { 
              duration: 0.5,
              ease: 'easeOut'
            }
          }}
        >
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-800 dark:from-pink-400 dark:via-purple-400 dark:to-pink-600 bg-clip-text text-transparent">
            Althea's
          </h1>
          <p className="text-2xl md:text-3xl font-light text-gray-600 dark:text-gray-300 mt-2">
            Cro-Shet
          </p>
          
          {/* Loading dots animation */}
          <div className="flex justify-center mt-8 space-x-2">
            {[0, 1, 2].map((i) => (
              <MOTION.div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
                initial={{ y: 0 }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </MOTION.div>
      </div>
    </div>
  );
};

export default Loader;
