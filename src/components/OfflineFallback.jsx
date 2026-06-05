import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflineFallback() {
  const [isChecking, setIsChecking] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    // Simulate check
    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-[#B8D8F0]/30 shadow-lg max-w-md w-full relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#B8D8F0]/20 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-[#4A90E2]/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3 font-serif">
            Mất kết nối Internet
          </h2>
          
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Có vẻ như bạn đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng Wi-Fi hoặc dữ liệu di động của bạn để tiếp tục trải nghiệm đầy đủ Music Space.
          </p>

          {isOnline ? (
            <div className="mb-6 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Kết nối đã được khôi phục!
            </div>
          ) : (
            <div className="mb-6 px-4 py-2 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              Đang ở chế độ ngoại tuyến
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              Thử kết nối lại
            </button>
            
            <a
              href="/"
              className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Về Trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
