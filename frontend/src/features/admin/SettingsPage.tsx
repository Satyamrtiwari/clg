import React, { useState, useEffect } from 'react';
import { settingsApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { QRCodeSVG } from 'qrcode.react';
import { Save, CheckCircle2, Store, Percent, QrCode, Smartphone, Clock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [canteenName, setCanteenName] = useState('Campus Smart Canteen');
  const [tagline, setTagline] = useState('Fresh. Fast. Delicious.');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [taxRate, setTaxRate] = useState('5.0');
  const [autoRemoveMins, setAutoRemoveMins] = useState('5');
  const [customDomain, setCustomDomain] = useState('');
  const [qrIntervalSecs, setQrIntervalSecs] = useState('30');
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const tenantSlug = canteenName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'canteen';
  
  // Base URL for QR Code: customDomain if specified, otherwise current window origin
  const baseUrl = customDomain.trim() || window.location.origin;
  const qrUrl = `${baseUrl}/${tenantSlug}/menu`;

  useEffect(() => {
    settingsApi.getConfig().then((cfg) => {
      if (cfg) {
        if (cfg.auto_remove_minutes !== undefined) setAutoRemoveMins(cfg.auto_remove_minutes.toString());
        if (cfg.tax_rate_percent !== undefined) setTaxRate(cfg.tax_rate_percent.toString());
        if (cfg.canteen_name) setCanteenName(cfg.canteen_name);
        if (cfg.currency_symbol) setCurrencySymbol(cfg.currency_symbol);
        if (cfg.qr_display_interval_seconds !== undefined) {
          setQrIntervalSecs(cfg.qr_display_interval_seconds.toString());
        }
      }
    }).catch(console.error);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await settingsApi.updateSetting('canteen_name', canteenName);
      await settingsApi.updateSetting('canteen_tagline', tagline);
      await settingsApi.updateSetting('currency_symbol', currencySymbol);
      await settingsApi.updateSetting('tax_rate_percent', parseFloat(taxRate) || 5.0);
      await settingsApi.updateSetting('auto_remove_minutes', parseInt(autoRemoveMins) || 5);
      await settingsApi.updateSetting('qr_display_interval_seconds', parseInt(qrIntervalSecs) ?? 30);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure your canteen branding, tax rates, and QR display timers.</p>
        </div>

        <Button onClick={handleSaveSettings} isLoading={loading} size="lg" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
          Save Configuration
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Settings updated successfully!
        </div>
      )}

      {/* SECTION 1: BRANDING */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 font-extrabold text-sm uppercase tracking-wider font-display">
          <Store className="w-5 h-5" /> Branding
        </div>

        <div className="space-y-4">
          <Input
            label="Canteen Name"
            value={canteenName}
            onChange={(e) => setCanteenName(e.target.value)}
            placeholder="e.g. Campus Smart Canteen"
          />

          <Input
            label="Tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Fresh. Fast. Delicious."
          />

          <Input
            label="Currency Symbol"
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
            placeholder="₹"
          />
        </div>
      </div>

      {/* SECTION 2: BILLING & TIMING */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 font-extrabold text-sm uppercase tracking-wider font-display">
          <Percent className="w-5 h-5" /> Billing & Display Timers
        </div>

        <div className="space-y-4">
          <Input
            label="GST (%)"
            type="number"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="5.0"
          />

          <Input
            label="Auto-remove Ready orders (minutes)"
            type="number"
            min="1"
            max="60"
            value={autoRemoveMins}
            onChange={(e) => setAutoRemoveMins(e.target.value)}
            placeholder="5"
          />

          {/* QR Code Display Timer Controls */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-500" /> Customer TV Display QR Code Auto-Show Interval
            </label>
            <select
              value={qrIntervalSecs}
              onChange={(e) => setQrIntervalSecs(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-rose-500"
            >
              <option value="15">Every 15 Seconds (Fast promo)</option>
              <option value="30">Every 30 Seconds (Default)</option>
              <option value="45">Every 45 Seconds</option>
              <option value="60">Every 60 Seconds (1 Minute)</option>
              <option value="120">Every 120 Seconds (2 Minutes)</option>
              <option value="0">❌ Do Not Show Automatically (Disabled)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control how frequently the TV display pops up the scannable Digital Menu QR code. Select "Do Not Show Automatically" to turn off automatic popups.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: QR MENU POSTER GENERATOR */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 font-extrabold text-sm uppercase tracking-wider font-display">
          <QrCode className="w-5 h-5" /> Customer Digital Menu QR Poster (SaaS Ready)
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customers scan this QR code with their mobile phone cameras to view the digital menu.
            </p>

            <Input
              label="Custom Domain / Local IP Address (Optional for Local Wi-Fi Testing)"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. http://192.168.1.100:5173 or https://canteen.com"
              leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
            />

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Scannable QR URL Target</span>
              <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 break-all">{qrUrl}</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 shrink-0 text-center space-y-2">
            <QRCodeSVG value={qrUrl} size={150} />
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Scan with Mobile Phone</p>
          </div>
        </div>
      </div>
    </div>
  );
};
