import React from "react";
import { customAPI } from "@/api/customClient";

export default function LoveFixed() {
  const [spaces, setSpaces] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("events");
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch spaces and events
        const [spacesData, eventsData] = await Promise.all([
          customAPI.entities.Space.find({ approved: true }).catch(() => []),
          customAPI.entities.Event.find().catch(() => [])
        ]);
        
        // Ensure we always have arrays
        setSpaces(Array.isArray(spacesData) ? spacesData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on search - ensure arrays
  const filteredSpaces = (Array.isArray(spaces) ? spaces : []).filter(space => 
    space.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = (Array.isArray(events) ? events : []).filter(event => 
    event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = activeTab === "spaces" ? filteredSpaces : filteredEvents;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-gray-800 mb-8">
            <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Love
            </span>
          </h1>
          <p className="text-2xl md:text-4xl text-gray-700 mb-8 font-light">
            Đặt vé cho không gian âm nhạc & sự kiện đặc biệt
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-3 flex items-center gap-4 shadow-2xl border border-sky-200">
              <div className="pl-4">
                <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={activeTab === "spaces" ? "Tìm kiếm không gian..." : "Tìm kiếm sự kiện..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-4 outline-none text-gray-700 placeholder-gray-400 text-lg font-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <section className="px-4 py-12 -mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-4 shadow-2xl border border-white/20">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab("events")}
                className={`px-8 py-6 rounded-[2rem] font-bold transition-all duration-300 ${
                  activeTab === "events"
                    ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 text-xl">
                    <span className="text-3xl">🎫</span>
                    <span className="text-3xl">Đặt vé</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {Array.isArray(events) ? events.length : 0} sự kiện
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("spaces")}
                className={`px-8 py-6 rounded-[2rem] font-bold transition-all duration-300 ${
                  activeTab === "spaces"
                    ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 text-xl">
                    <span className="text-3xl">🏠</span>
                    <span className="text-3xl">Spaces</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {Array.isArray(spaces) ? spaces.length : 0} không gian
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              {activeTab === "events" ? 'Đặt vé sự kiện' : 'Đặt chỗ không gian'}
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {currentItems.length} {activeTab === "events" ? "sự kiện" : "không gian"}
            </p>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Có lỗi xảy ra</h3>
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && currentItems.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
              <div className="text-6xl mb-4">
                {activeTab === "spaces" ? "🏠" : "🎫"}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3">
                {activeTab === "spaces" ? "Không tìm thấy không gian" : "Chưa có sự kiện nào"}
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                {activeTab === "spaces" ? "Thử tìm kiếm với từ khóa khác" : "Chúng tôi sẽ cập nhật sự kiện mới sớm"}
              </p>
            </div>
          )}

          {!loading && !error && currentItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((item, index) => (
                <div key={item.id || index} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                  {item.image_url && (
                    <div className="h-48 bg-gray-200 rounded-2xl mb-4 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.name || item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {item.name || item.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  
                  {item.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{item.address}</span>
                    </div>
                  )}
                  
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold rounded-2xl hover:shadow-lg transition-all">
                    {activeTab === "spaces" ? "Đặt chỗ" : "Đặt vé"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
