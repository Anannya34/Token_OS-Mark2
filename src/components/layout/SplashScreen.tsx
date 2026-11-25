import React, { useEffect, useRef } from 'react';
import { Play, ShieldCheck, Sparkles, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { TextScramble } from '../common/TextScramble';
import TechText from './TechText';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Matrix Cyber Rain Background Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const cols = Math.floor(width / 20);
    const ypos = Array(cols).fill(0);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const matrixChars = 'TOKENOS0123456789%#@$&*!?<>[]{}/\\~';

    const renderMatrix = () => {
      ctx.fillStyle = 'rgba(11, 15, 23, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#D97757';
      ctx.font = '12pt monospace';

      ypos.forEach((y, index) => {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = index * 20;

        ctx.fillStyle = index % 5 === 0 ? '#E2896B' : 'rgba(42, 54, 79, 0.4)';
        ctx.fillText(char, x, y);

        if (y > 100 + Math.random() * 10000) ypos[index] = 0;
        else ypos[index] = y + 20;
      });
    };

    const interval = setInterval(renderMatrix, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[#0B0F17] flex flex-col justify-between p-6 sm:p-12 overflow-hidden select-none"
    >
      {/* Matrix Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40 z-0" />

      {/* Cyber Scanline Layer */}
      <div className="ghost-scanline absolute inset-x-0 pointer-events-none z-10" />

      {/* Radial Glow Lights */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#D97757]/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#E2896B]/15 blur-[120px] pointer-events-none" />

      {/* Top Header Telemetry */}
      <div className="relative z-20 flex items-center justify-between font-mono text-xs text-slate-400 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#D97757] shadow-[0_0_12px_#D97757] animate-ping" />
          <span className="text-[#F0F4F8] font-bold tracking-widest uppercase text-sm">
            TOKEN-<span className="text-[#D97757]">OS</span> MASTER CONTROL PLANE
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            PROVENANCE: <span className="text-emerald-400 font-bold">MEASURED_LOCALLY</span>
          </span>
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97757]" />
            HALLUCINATION FIREWALL: <span className="text-[#E2896B] font-bold">ENFORCED</span>
          </span>
        </div>
      </div>

      {/* Main Glitched Title */}
      <div className="relative z-20 my-auto text-center flex flex-col items-center justify-center space-y-6 w-full">
        {/* Floating Decoded Subtitle Ticker */}
        <motion.div
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-[#D97757]/15 border border-[#D97757]/40 rounded-full px-5 py-2 font-mono text-xs sm:text-sm text-[#E2896B] shadow-[0_0_20px_rgba(217,119,87,0.3)]"
        >
          <Sparkles className="w-4 h-4 text-[#D97757] animate-spin" />
          <TextScramble text="INTENT-AWARE AI EXECUTION CONTROL PLANE" scrambleSpeed={25} />
        </motion.div>

        {/* Interactive TechText Canvas Title - Enlarged Screen End to End & Dynamically Responsive */}
        <div style={{ width: '100%', height: '380px', maxHeight: '42vh', position: 'relative' }} className="w-full max-w-none px-2 sm:px-6 mx-auto py-1 flex items-center justify-center">
          <TechText
            text="TOKEN-OS"
            fontWeight={900}
            fontFamily="'Mona Sans', 'Inter', system-ui, sans-serif"
            letterSpacing={-0.02}
            autoFit={true}
            fontSize={240}
            strokeWidth={3.5}
            dashLength={6}
            dashGap={3}
            specks={15}
            reveal="letter"
            accentColor="#D97757"
            color="#F0F4F8"
          />
        </div>

        {/* GET STARTED CTA Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-6"
        >
          <button
            onClick={onGetStarted}
            className="group relative inline-flex items-center gap-3 bg-[#D97757] hover:bg-[#E2896B] text-black font-mono font-black text-lg px-12 py-4.5 rounded-xl shadow-[0_0_40px_rgba(217,119,87,0.6)] hover:shadow-[0_0_60px_rgba(217,119,87,0.9)] transition-all transform hover:-translate-y-1 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-6 h-6 fill-black group-hover:scale-110 transition-transform" />
            <span>GET STARTED</span>
            <Zap className="w-5 h-5 fill-black text-black" />
          </button>
        </motion.div>
      </div>

      {/* Bottom Footer Metadata */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
        <span>© 2026 TokenOS Architecture Matrix</span>
      </div>
    </motion.div>
  );
};
