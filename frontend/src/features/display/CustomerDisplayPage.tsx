import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, settingsApi } from '@/services/api';
import { useThemeStore } from '@/store/useThemeStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle2, Volume2, VolumeX, Maximize, Utensils, Sun, Moon, QrCode, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerDisplayPage: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRemoveSeconds, setAutoRemoveSeconds] = useState(300); // 5 minutes
  const [canteenName, setCanteenName] = useState('Campus Smart Canteen');
  const [customDomain, setCustomDomain] = useState('');
  
  // Dynamic QR Code auto-popup settings from Admin
  const [qrIntervalSecs, setQrIntervalSecs] = useState<number>(30);
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [qrTimer, setQrTimer] = useState<number>(30);

  const prevReadyIdsRef = useRef<Set<string>>(new Set());
  const { theme, toggleTheme } = useThemeStore();

  const tenantSlug = canteenName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'canteen';
  const baseUrl = customDomain.trim() || window.location.origin;
  const qrUrl = `${baseUrl}/${tenantSlug}/menu`;

  // Audio effect generator using Web Audio API synthesis
  const playReadyChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // Fetch initial config for auto remove timer, canteen name, and QR interval
  useEffect(() => {
    settingsApi.getConfig().then((cfg) => {
      if (cfg) {
        if (cfg.auto_remove_minutes) {
          setAutoRemoveSeconds(cfg.auto_remove_minutes * 60);
        }
        if (cfg.canteen_name) {
          setCanteenName(cfg.canteen_name);
        }
        if (cfg.qr_display_interval_seconds !== undefined) {
          const interval = cfg.qr_display_interval_seconds;
          setQrIntervalSecs(interval);
          setQrTimer(interval);
        }
      }
    }).catch(console.error);
  }, []);

  // Automated Configurable QR Code Popup Loop
  useEffect(() => {
    if (qrIntervalSecs <= 0) return; // Disabled by Admin

    const interval = setInterval(() => {
      setQrTimer((prev) => {
        if (prev <= 1) {
          setShowQRPopup(true);
          // Hide popup after 8 seconds of display
          setTimeout(() => {
            setShowQRPopup(false);
          }, 8000);
          return qrIntervalSecs; // Reset to configured interval
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qrIntervalSecs]);

  // Query display orders
  const { data: displayOrders = [], refetch } = useQuery({
    queryKey: ['display-orders'],
    queryFn: () => ordersApi.getDisplayOrders(),
    refetchInterval: 5000,
  });

  // Listen to WebSocket broadcasts
  useWebSocket('display', (event) => {
    if (['ORDER_CREATED', 'ORDER_UPDATED'].includes(event.event)) {
      refetch();
    }
    if (event.event === 'SETTINGS_UPDATED') {
      settingsApi.getConfig().then((cfg) => {
        if (cfg?.qr_display_interval_seconds !== undefined) {
          const interval = cfg.qr_display_interval_seconds;
          setQrIntervalSecs(interval);
          setQrTimer(interval);
        }
      }).catch(console.error);
    }
  });

  // Safe UTC Date Parser
  const parseUTCDate = (dateStr?: string | null) => {
    if (!dateStr) return new Date();
    let cleanStr = dateStr.trim();
    if (!cleanStr.endsWith('Z') && !cleanStr.includes('+')) {
      cleanStr = `${cleanStr.replace(' ', 'T')}Z`;
    }
    const parsed = new Date(cleanStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Filter PREPARING orders
  const preparingOrders = displayOrders.filter((o) => o.status === 'PREPARING');
  
  // Filter READY orders ("Please Collect")
  const now = new Date().getTime();
  const readyOrders = displayOrders.filter((o) => {
    if (o.status !== 'READY') return false;
    const completedTime = parseUTCDate(o.completed_at || o.updated_at).getTime();
    const elapsedSeconds = Math.max(0, (now - completedTime) / 1000);
    return elapsedSeconds < autoRemoveSeconds;
  });

  // Play audio chime when a new order enters READY state
  useEffect(() => {
    const currentReadyIds = new Set(readyOrders.map((o) => o.id));
    const newReadyDetected = readyOrders.some((o) => !prevReadyIdsRef.current.has(o.id));

    if (newReadyDetected && prevReadyIdsRef.current.size > 0) {
      playReadyChime();
    }

    prevReadyIdsRef.current = currentReadyIds;
  }, [readyOrders]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between select-none overflow-hidden font-sans transition-colors duration-200 relative">
      {/* Top Header Bar */}
      <header className="px-8 py-5 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-md dark:shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/10 dark:bg-rose-600/20 border border-rose-500/30 text-rose-600 dark:text-rose-500 flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white">{canteenName}</h1>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">LIVE ORDER STATUS DISPLAY</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Scan QR Menu Quick Toggle & Countdown */}
          <button
            onClick={() => setShowQRPopup(!showQRPopup)}
            className="p-2.5 px-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors flex items-center gap-2"
            title="Scan Digital Menu QR"
          >
            <QrCode className="w-4 h-4 animate-pulse text-rose-500" />
            <span className="hidden sm:inline">
              QR Menu {qrIntervalSecs > 0 ? `(${qrTimer}s)` : '(Manual)'}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Toggle Day / Night Mode"
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="hidden sm:inline">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-sky-400" />
                <span className="hidden sm:inline">Night Mode</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Split Columns Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-8 overflow-hidden">
        {/* PREPARING COLUMN */}
        <div className="flex flex-col rounded-3xl bg-amber-500/5 dark:bg-slate-900/40 border border-amber-500/30 p-6 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-3xl font-black font-display tracking-wider text-amber-600 dark:text-amber-400 uppercase">Preparing</h2>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-lg">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
            <AnimatePresence>
              {preparingOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">ORDER</span>
                    <h3 className="text-6xl font-black text-slate-900 dark:text-white font-display leading-none tracking-tight my-1">
                      {order.daily_order_number}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200 truncate">{order.customer_name}</span>
                    <span className="text-xs text-amber-600 dark:text-amber-400/80 font-mono font-semibold">IN KITCHEN</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {preparingOrders.length === 0 && (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <Clock className="w-16 h-16 stroke-[1]" />
                <p className="text-lg font-semibold mt-2">No orders currently preparing</p>
              </div>
            )}
          </div>
        </div>

        {/* PLEASE COLLECT / READY COLUMN */}
        <div className="flex flex-col rounded-3xl bg-emerald-500/5 dark:bg-slate-900/40 border border-emerald-500/30 p-6 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/30 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-3xl font-black font-display tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">Please Collect</h2>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-lg">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
            <AnimatePresence>
              {readyOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.3 } }}
                  layout
                  className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase rounded-bl-xl tracking-wider">
                    READY
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">ORDER</span>
                    <h3 className="text-6xl font-black text-slate-900 dark:text-white font-display leading-none tracking-tight my-1">
                      {order.daily_order_number}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-500/30">
                    <span className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300 truncate">{order.customer_name}</span>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {readyOrders.length === 0 && (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <CheckCircle2 className="w-16 h-16 stroke-[1]" />
                <p className="text-lg font-semibold mt-2">No orders ready for pickup</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 30-Second QR Code Overlay Modal */}
      <AnimatePresence>
        {showQRPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="bg-white dark:bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
              <button
                onClick={() => setShowQRPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30">
                <Smartphone className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest font-display">
                  Scan With Mobile Phone
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">View Digital Canteen Menu</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Browse categories, today's specials & prices on your phone!</p>
              </div>

              {/* Scannable QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block mx-auto">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>

              <div className="pt-2 text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                <span>Closing in 8s</span> •{' '}
                <span className="text-rose-500 font-bold">
                  {qrIntervalSecs > 0 ? `Auto-shows every ${qrIntervalSecs}s` : 'Manual mode'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticker Footer */}
      <footer className="px-8 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 flex justify-between items-center z-20">
        <span>⚡ Real-Time WebSocket Connected</span>
        <span>Orders automatically clear after pickup • Enjoy your meal!</span>
      </footer>
    </div>
  );
};
