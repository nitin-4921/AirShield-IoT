import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

export default function Character({ aqi }) {
  // Sprite has 4 evenly spaced character states
  let bgGradient = "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)";
  let bgOffsetX = '0%'; // Safe
  let fogVisible = 0;
  
  if (aqi > 50 && aqi <= 100) {
    // MODERATE
    bgGradient = "radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)";
    bgOffsetX = '33.33%';
  } else if (aqi > 100 && aqi <= 200) {
    // UNHEALTHY
    bgGradient = "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)";
    bgOffsetX = '66.66%';
  } else if (aqi > 200) {
    // HAZARDOUS
    bgGradient = "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)";
    bgOffsetX = '100%';
    fogVisible = 1;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Intense Background Glow behind the character */}
      <motion.div 
        className="absolute inset-0 z-0 transition-all duration-1000"
        style={{ background: bgGradient }}
      />
      
      {/* The Transparent Sprite Container */}
      <motion.div 
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-80 h-96 md:w-96 md:h-[440px] drop-shadow-2xl"
      >
         {/* The gracefully transparent generating Sprite Image */}
         <motion.div
           className="w-full h-full bg-no-repeat transition-all duration-700 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
           initial={false}
           animate={{ backgroundPositionX: bgOffsetX }}
           style={{ 
             backgroundImage: "url('/character_sprite.png')",
             backgroundSize: '400% 100%',
             backgroundPositionY: 'center',
           }}
         />

        {/* Floating Smog/Fog overlay over the character image for hazardous */}
        <AnimatePresence>
          {fogVisible === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <motion.div className="absolute top-[50%] left-[10%] w-[60px] h-[60px] rounded-full bg-slate-500 opacity-50 blur-xl"
                animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }} transition={{ duration: 5, repeat: Infinity }} />
              <motion.div className="absolute top-[30%] left-[40%] w-[80px] h-[80px] rounded-full bg-slate-600 opacity-50 blur-xl"
                animate={{ y: [15, -15, 15], x: [10, -10, 10] }} transition={{ duration: 6, repeat: Infinity }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
