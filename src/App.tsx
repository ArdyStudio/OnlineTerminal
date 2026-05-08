import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Download, Sparkles, X, QrCode, Heart, Palette } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { useCamera } from '@/src/hooks/useCamera';
import { CountdownOverlay } from '@/src/components/CountdownOverlay';
import { SessionStatus, PhotoFilter, FILTERS, FrameTheme, THEMES, GridLayout, GRID_LAYOUTS } from '@/src/types';
import { generatePhotostrip } from '@/src/lib/photostrip';
import { cn } from '@/src/lib/utils';

export default function App() {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [photos, setPhotos] = useState<string[]>([]);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [isShowingCapture, setIsShowingCapture] = useState(false);
  const [progressionTimer, setProgressionTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentFilter, setCurrentFilter] = useState<PhotoFilter>('none');
  const [currentTheme, setCurrentTheme] = useState<FrameTheme>('minimal');
  const [currentLayout, setCurrentLayout] = useState<GridLayout>('vertical');
  const [countdownKey, setCountdownKey] = useState(0);
  const [finalStrip, setFinalStrip] = useState<string | null>(null);
  
  const { videoRef, stream, startCamera, stopCamera, capture, error } = useCamera();
  const isCapturingRef = React.useRef(false);

  // Ensure camera starts early if user is at setup or start
  useEffect(() => {
    if (status === 'idle') {
      // Optional: don't start until requested to save battery/privacy 
      // but if user wants it "from start" we can trigger it here if desired.
    }
  }, [status]);

  // Keep camera alive and attached to video element
  useEffect(() => {
    let active = true;
    const syncVideo = async () => {
      if (videoRef.current && stream && active) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        try {
          await videoRef.current.play();
        } catch (e) {
          // Ignore play errors
        }
      }
    };
    
    syncVideo();
    return () => { active = false; };
  }, [stream, videoRef, status]);

  const startSession = async () => {
    await startCamera();
    setStatus('ready');
    setPhotos([]);
    setLastPhoto(null);
    setIsShowingCapture(false);
  };

  const startCountdown = () => {
    isCapturingRef.current = false;
    setLastPhoto(null);
    setIsShowingCapture(false);
    setCountdownKey(k => k + 1);
    setStatus('counting');
  };

  const handleRetake = useCallback(() => {
    setProgressionTimer((prev) => {
      if (prev) clearTimeout(prev);
      return null;
    });
    
    setPhotos((prev) => prev.slice(0, -1));
    setLastPhoto(null);
    setIsShowingCapture(false);
    setStatus('ready');
    console.log('Retake clicked: status set to ready, photo removed');
  }, []);

  const handleKeep = useCallback(() => {
    setProgressionTimer((prev) => {
      if (prev) clearTimeout(prev);
      return null;
    });
    
    setIsShowingCapture(false);
    setLastPhoto(null);
    
    // Use a functional update to get the very latest count of photos
    setPhotos((current) => {
      // Logic for moving state should be outside setPhotos update but let's be pragmatic here
      // We check if we just added the 3rd photo (or if we somehow have more)
      if (current.length >= 3) {
        setTimeout(() => setStatus('processing'), 0);
      } else {
        setTimeout(() => setStatus('ready'), 0);
      }
      return current;
    });
    
    console.log('Keep clicked');
  }, []);

  const handleCapture = useCallback(() => {
    // Guard: don't capture if we are already reviewing or processing
    if (status !== 'counting' || isCapturingRef.current) {
      console.warn('Capture ignored: status is', status, 'isCapturing:', isCapturingRef.current);
      return;
    }

    isCapturingRef.current = true;
    const dataUrl = capture(FILTERS[currentFilter]);
    if (!dataUrl) {
      console.error('Capture failed: no dataUrl');
      setStatus('ready');
      return;
    }

    setLastPhoto(dataUrl);
    setIsShowingCapture(true);
    setStatus('reviewing');
    
    setPhotos((prev) => {
      if (prev.length >= 3) return prev;
      const next = [...prev, dataUrl];
      console.log('Capture added photo, total:', next.length);
      return next;
    });

    const timer = setTimeout(() => {
      handleKeep();
    }, 15000); 
    
    setProgressionTimer(timer);
  }, [capture, currentFilter, handleKeep, status]);

  useEffect(() => {
    if (photos.length >= 3 && (status === 'processing' || status === 'review')) {
      const process = async () => {
        try {
          // Take exactly 3 photos to avoid 4/3 issue on canvas
          const validPhotos = photos.slice(0, 3);
          const strip = await generatePhotostrip(validPhotos, currentTheme, currentLayout);
          setFinalStrip(strip);
          
          if (status === 'processing') {
            setStatus('review');
            stopCamera();
          }
        } catch (err) {
          console.error("Failed to generate strip:", err);
          if (status === 'processing') setStatus('idle');
        }
      };
      process();
    }
  }, [photos, status, stopCamera, currentTheme, currentLayout]);

  const resetSession = () => {
    setStatus('idle');
    setPhotos([]);
    setFinalStrip(null);
    stopCamera();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black font-sans selection:bg-gold/30">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-aurora pointer-events-none" />

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-8xl font-serif text-gold mb-4 italic tracking-tight">
                AiChi Studio
              </h1>
              <p className="text-white/60 font-serif italic text-lg md:text-xl tracking-widest uppercase">
                Where Love Becomes Memories
              </p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-12 py-5 rounded-full bg-gold text-black font-semibold text-lg flex items-center gap-3 hover:bg-gold-light transition-colors shadow-[0_10px_40px_rgba(197,160,89,0.3)]"
            >
              <Camera size={24} />
              Start Photo Session
            </motion.button>
            
            <div className="mt-20 flex gap-12 text-white/40 grayscale opacity-50">
               <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-16 border-2 border-current rounded-sm"></div>
                  <span className="text-[10px] uppercase tracking-widest">3-Grid Strip</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Sparkles size={24} />
                  <span className="text-[10px] uppercase tracking-widest">AI Filters</span>
               </div>
            </div>
          </motion.div>
        )}

        {(status === 'ready' || status === 'counting' || status === 'reviewing' || status === 'processing') && (
          <motion.div
            key="booth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 h-screen flex flex-col items-center justify-center p-4"
          >
            {/* Elegant Top Bar / Cancel */}
            <div className="absolute top-8 w-full px-8 flex justify-between items-center z-50">
              <div className="flex items-center gap-2 text-gold italic font-serif text-xl">
                AiChi Studio
              </div>
              <button 
                onClick={resetSession}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full glass-card border-white/5 hover:bg-white/10 transition-all text-[10px] uppercase tracking-[0.2em] font-bold text-white/80 hover:text-white"
              >
                <X size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                Exit Booth
              </button>
            </div>

              <div className="relative w-full max-w-md aspect-[3/4] glass-card rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/20 bg-neutral-900 group">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                  style={{ filter: FILTERS[currentFilter] }}
                />

                {/* Ready State - Manual Capture Button */}
                {status === 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startCountdown}
                    className="w-24 h-24 rounded-full border-4 border-gold bg-black/40 backdrop-blur-md flex items-center justify-center text-gold shadow-[0_0_30px_rgba(197,160,89,0.3)]"
                  >
                    <div className="w-16 h-16 rounded-full bg-gold/80 animate-pulse flex items-center justify-center text-black">
                      <Camera size={32} />
                    </div>
                  </motion.button>
                  <p className="absolute bottom-12 text-white/60 font-serif italic tracking-widest text-sm animate-bounce">
                    Click to start countdown
                  </p>
                </div>
              )}

              {/* Status Flash when capture happens */}
              <AnimatePresence>
                {isShowingCapture && (
                  <motion.div 
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-white z-[70] pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Live Frame Preview Overlay (Wedding/Birthday accents) */}
              <div className="absolute inset-0 pointer-events-none border-[1.5rem] border-transparent z-30 overflow-hidden">
                 {currentTheme === 'wedding' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 border-white/40 border-[2px] m-4 flex flex-col justify-between p-4"
                    >
                      <div className="flex justify-between w-full opacity-50">
                        <Heart size={16} />
                        <Heart size={16} />
                      </div>
                      <div className="flex justify-between w-full opacity-50">
                        <Heart size={16} />
                        <Heart size={16} />
                      </div>
                    </motion.div>
                 )}
                 {currentTheme === 'birthday' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Sparkles size={80} className="text-gold/20 animate-pulse" />
                    </motion.div>
                 )}
              </div>

              {/* Capture Review Overlay - Moved outside overflow-hidden aspect ratio container further down */}
              
              {status === 'counting' && (
                <CountdownOverlay 
                  countKey={countdownKey} 
                  onComplete={handleCapture} 
                />
              )}

              {status === 'processing' && (
                <div className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="text-gold"
                  >
                    <Sparkles size={48} />
                  </motion.div>
                  <p className="font-serif italic text-gold text-xl animate-pulse">Creating your memories...</p>
                </div>
              )}

              {/* Progress dots */}
              <div className="absolute top-10 left-10 flex flex-col gap-3 z-50">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-1.5 h-8 rounded-full transition-all duration-700",
                      photos.length > i ? "bg-gold shadow-[0_0_15px_rgba(197,160,89,0.8)]" : "bg-white/10"
                    )}
                  />
                ))}
              </div>

              {/* Review Overlay - Optimized for visibility and elegance */}
              <AnimatePresence>
                {status === 'reviewing' && lastPhoto && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 40, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      className="relative w-full max-w-[340px] flex flex-col items-center pointer-events-auto max-h-[90vh]"
                    >
                      {/* Section Title */}
                      <div className="mb-6 text-center">
                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-gold/60 mb-1 block">Review Snapshot</span>
                        <h3 className="text-xl font-serif italic text-white">Capture {photos.length} of 3</h3>
                      </div>

                      {/* Polaroid-style Image Frame */}
                      <div className="w-full shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-[10px] border-white rounded-sm overflow-hidden bg-white rotate-1 transition-transform hover:rotate-0 duration-700 flex-shrink min-h-0">
                        <div className="aspect-[3/4] bg-neutral-900 overflow-hidden relative">
                           <img src={lastPhoto} alt="Captured" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] pointer-events-none" />
                        </div>
                        <div className="p-4 flex justify-between items-center bg-white border-t border-neutral-100">
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">Snapshot {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-[7px] text-neutral-300 uppercase tracking-tighter">AiChi Luxury Photobooth</span>
                           </div>
                           <div className="h-8 w-8 rounded-full border border-neutral-100 flex items-center justify-center">
                             <span className="text-xs font-serif italic text-gold">{photos.length}</span>
                           </div>
                        </div>
                      </div>

                      {/* Action Group */}
                      <div className="mt-8 flex flex-col gap-4 w-full px-4">
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleKeep}
                          className="w-full py-5 rounded-xl bg-gold text-black font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(197,160,89,0.3)] overflow-hidden relative group"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            Keep & Next <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                          </span>
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-black/10"
                          />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleRetake}
                          className="w-full py-5 rounded-xl bg-white/10 border border-white/20 text-white font-bold uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-2 hover:bg-white/20 hover:border-white/50 transition-all shadow-xl"
                        >
                          <RefreshCw size={16} /> Try Again
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selection Controls - Only show when ready or counting */}
            {(status === 'ready' || status === 'counting') && (
              <div className="w-full max-w-lg mt-8 flex flex-col gap-6">
                {/* Theme selection */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold px-2">
                    <Palette size={12} /> Choose Frame
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {(Object.keys(THEMES) as FrameTheme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setCurrentTheme(t)}
                        className={cn(
                          "group relative px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border shrink-0",
                          currentTheme === t 
                            ? "bg-white text-black border-white shadow-[0_15px_30px_rgba(255,255,255,0.2)]" 
                            : "bg-white/5 text-white/60 border-white/10 hover:border-white/30"
                        )}
                      >
                        {THEMES[t].name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter selection */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold px-2">
                    <Sparkles size={12} /> Color Filter
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {(Object.keys(FILTERS) as PhotoFilter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setCurrentFilter(f)}
                        className={cn(
                          "px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border shrink-0",
                          currentFilter === f 
                            ? "bg-gold text-black border-gold shadow-[0_15px_30px_rgba(197,160,89,0.2)]" 
                            : "bg-white/5 text-white/60 border-white/10 hover:border-white/30"
                        )}
                      >
                        {f === 'none' ? 'Natural' : f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {status === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 min-h-screen w-full flex flex-col items-center py-20 px-6 overflow-y-auto"
          >
            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 items-start justify-center">
              {/* Left Column: Individual Photos Gallery */}
              <div className="flex flex-col gap-8 w-full lg:w-1/3">
                <div className="flex flex-col gap-2">
                  <span className="text-gold text-[10px] uppercase font-bold tracking-[0.3em]">Individual Moments</span>
                  <h2 className="text-3xl font-serif text-white italic">The Collection</h2>
                </div>

                {/* Layout selection - Moved here */}
                <div className="flex flex-col gap-3 p-5 glass-card rounded-3xl border-white/5">
                  <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase tracking-[0.3em] font-bold px-1">
                    Custom Layout
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(GRID_LAYOUTS) as GridLayout[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setCurrentLayout(l)}
                        className={cn(
                          "px-3 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-[0.05em] transition-all border",
                          currentLayout === l 
                            ? "bg-gold text-black border-gold shadow-lg" 
                            : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                        )}
                      >
                        {GRID_LAYOUTS[l].name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                  {photos.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative border-4 border-white shadow-xl rotate-1 group hover:rotate-0 transition-all duration-500"
                    >
                      <img src={p} alt={`Moment ${i+1}`} className="w-full aspect-[3/4] object-cover" />
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-white flex justify-between items-center">
                        <span className="text-[10px] font-serif italic text-gold">#{i+1}</span>
                        <span className="text-[8px] text-neutral-300">AiChi</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Middle Column: Final Strip Preview */}
              <div className="flex flex-col items-center gap-8 w-full lg:w-1/3">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-gold text-[10px] uppercase font-bold tracking-[0.3em]">Final Composite</span>
                  <h2 className="text-3xl font-serif text-white italic">Your Photostrip</h2>
                </div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-[400px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden"
                >
                  {finalStrip && (
                    <img src={finalStrip} alt="Your Photostrip" className="w-full h-auto" />
                  )}
                </motion.div>
              </div>

              {/* Right Column: Actions & Share */}
              <div className="flex flex-col gap-8 w-full lg:w-1/3">
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-serif text-gold italic">Pure Elegance.</h3>
                  <p className="text-white/60 leading-relaxed text-sm">
                    Capture the essence of your love in a single frame. 
                    Download your photostrip to keep these memories forever.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.a 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    href={finalStrip || '#'} 
                    download={`aichi-strip-${Date.now()}.jpg`}
                    className="w-full py-5 rounded-2xl bg-gold text-black font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(197,160,89,0.3)]"
                  >
                    <Download size={18} /> Download Strip
                  </motion.a>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetSession}
                    className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/30 transition-all shadow-xl"
                  >
                    <RefreshCw size={16} /> New Session
                  </motion.button>
                </div>

                <div className="p-8 glass-card rounded-3xl border-white/5 flex flex-col items-center gap-4 text-center shadow-[0_30px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                  <div className="bg-white p-4 rounded-2xl shadow-inner group hover:scale-105 transition-transform duration-500">
                    {finalStrip && (
                      <QRCodeSVG 
                        value={window.location.href} 
                        size={140} 
                        fgColor={THEMES[currentTheme].bg === '#FFF9F9' ? '#000000' : '#000000'} // Keep black for reliability but maybe add a tinted border
                        level="H"
                        includeMargin={false}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gold text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Save to Device</span>
                    <p className="text-[10px] text-white/40 max-w-[120px] mx-auto leading-relaxed">Scan with your phone to take this moment home</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-white/20 text-[10px] uppercase tracking-[0.2em] font-medium">
        <Heart size={10} className="fill-current text-gold/40" /> made by Love Ardy & Chinta
      </footer>

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-6 py-3 rounded-full flex items-center gap-3 animate-bounce">
          <X size={20} /> {error}
        </div>
      )}
    </div>
  );
}
