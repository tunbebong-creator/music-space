import React from "react";

export default function LoveSimple() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Love - Test Page
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Trang Love đang hoạt động!</h2>
          <p className="text-gray-600 mb-4">
            Đây là phiên bản đơn giản để test xem trang có load được không.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">✅ Component đã load</h3>
              <p className="text-blue-600">React component đang hoạt động bình thường</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ Routing hoạt động</h3>
              <p className="text-green-600">Trang Love đã được route thành công</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800">⚠️ Cần kiểm tra</h3>
              <p className="text-yellow-600">Các dependencies như framer-motion, react-leaflet, @tanstack/react-query</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• React version: {React.version}</li>
              <li>• Current time: {new Date().toLocaleString()}</li>
              <li>• User agent: {navigator.userAgent}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}













