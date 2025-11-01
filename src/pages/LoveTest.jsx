import React from "react";

// Test từng dependency một cách có hệ thống
export default function LoveTest() {
  const [testResults, setTestResults] = React.useState({
    react: true,
    framerMotion: false,
    reactLeaflet: false,
    tanstackQuery: false,
    dateFns: false,
    lucideReact: false
  });

  React.useEffect(() => {
    const results = { ...testResults };
    
    // Test framer-motion
    try {
      const { motion } = require("framer-motion");
      results.framerMotion = true;
    } catch (e) {
      console.error("framer-motion error:", e);
    }
    
    // Test react-leaflet
    try {
      const { MapContainer } = require("react-leaflet");
      results.reactLeaflet = true;
    } catch (e) {
      console.error("react-leaflet error:", e);
    }
    
    // Test @tanstack/react-query
    try {
      const { useQuery } = require("@tanstack/react-query");
      results.tanstackQuery = true;
    } catch (e) {
      console.error("@tanstack/react-query error:", e);
    }
    
    // Test date-fns
    try {
      const { format } = require("date-fns");
      const { vi } = require("date-fns/locale");
      results.dateFns = true;
    } catch (e) {
      console.error("date-fns error:", e);
    }
    
    // Test lucide-react
    try {
      const { MapPin, Search } = require("lucide-react");
      results.lucideReact = true;
    } catch (e) {
      console.error("lucide-react error:", e);
    }
    
    setTestResults(results);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Love - Dependency Test
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Kết quả kiểm tra dependencies:</h2>
          
          <div className="space-y-4">
            {Object.entries(testResults).map(([dep, working]) => (
              <div key={dep} className={`p-4 rounded-lg ${working ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${working ? 'text-green-600' : 'text-red-600'}`}>
                    {working ? '✅' : '❌'}
                  </span>
                  <div>
                    <h3 className={`font-semibold ${working ? 'text-green-800' : 'text-red-800'}`}>
                      {dep}
                    </h3>
                    <p className={`text-sm ${working ? 'text-green-600' : 'text-red-600'}`}>
                      {working ? 'Hoạt động bình thường' : 'Có lỗi - cần kiểm tra'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Hướng dẫn debug:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Mở Developer Tools (F12)</li>
              <li>• Kiểm tra tab Console để xem lỗi chi tiết</li>
              <li>• Kiểm tra tab Network để xem có request nào fail không</li>
              <li>• Nếu có dependency bị lỗi, cần cài đặt lại hoặc kiểm tra version</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

















