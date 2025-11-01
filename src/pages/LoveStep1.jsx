import React from "react";
import { customAPI } from "@/api/customClient";

export default function LoveStep1() {
  const [spaces, setSpaces] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const data = await customAPI.entities.Space.find({ approved: true });
        setSpaces(data);
      } catch (err) {
        console.error("Error fetching spaces:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          Love - Step 1: API Test
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Kiểm tra API và data:</h2>
          
          {loading && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600">🔄 Đang tải dữ liệu...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ Lỗi API:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ API hoạt động:</h3>
              <p className="text-green-600">Đã tải được {spaces.length} không gian</p>
              
              {spaces.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Danh sách không gian:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {spaces.slice(0, 5).map((space, index) => (
                      <div key={space.id || index} className="p-2 bg-white rounded border">
                        <p className="font-medium">{space.name || 'Không có tên'}</p>
                        <p className="text-sm text-gray-600">{space.address || 'Không có địa chỉ'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

















