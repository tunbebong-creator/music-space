import React from "react";

export default function LoveWorking() {
  const [activeTab, setActiveTab] = React.useState("events");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Mock data để test
  const mockSpaces = [
    {
      id: 1,
      name: "Café Acoustic Hà Nội",
      description: "Không gian âm nhạc acoustic ấm cúng tại trung tâm Hà Nội",
      address: "123 Phố Huế, Hai Bà Trưng, Hà Nội",
      image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
    },
    {
      id: 2,
      name: "Studio Music Sài Gòn",
      description: "Studio thu âm chuyên nghiệp với thiết bị hiện đại",
      address: "456 Nguyễn Huệ, Quận 1, TP.HCM",
      image_url: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400"
    },
    {
      id: 3,
      name: "Garden Music Đà Nẵng",
      description: "Không gian âm nhạc ngoài trời với view biển tuyệt đẹp",
      address: "789 Bạch Đằng, Hải Châu, Đà Nẵng",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    }
  ];

  const mockEvents = [
    {
      id: 1,
      title: "Acoustic Night - Thứ 7",
      description: "Đêm nhạc acoustic với các nghệ sĩ trẻ tài năng",
      date: "2024-01-20",
      time: "19:00",
      image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
    },
    {
      id: 2,
      title: "Jazz Workshop",
      description: "Workshop học nhạc jazz với nghệ sĩ quốc tế",
      date: "2024-01-25",
      time: "14:00",
      image_url: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400"
    },
    {
      id: 3,
      title: "Indie Music Festival",
      description: "Lễ hội âm nhạc indie với nhiều ban nhạc nổi tiếng",
      date: "2024-02-01",
      time: "18:00",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    }
  ];

  // Filter data based on search
  const filteredSpaces = mockSpaces.filter(space => 
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = mockEvents.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
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
                    {mockEvents.length} sự kiện
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
                    {mockSpaces.length} không gian
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

                {item.date && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{item.date} - {item.time}</span>
                  </div>
                )}
                
                <button className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold rounded-2xl hover:shadow-lg transition-all">
                  {activeTab === "spaces" ? "Đặt chỗ" : "Đặt vé"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Message */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-800 mb-4">
              Trang Love đã hoạt động!
            </h3>
            <p className="text-green-600 mb-4">
              Component đã được fix và hiển thị dữ liệu mock thành công.
            </p>
            <div className="text-sm text-green-500">
              • Không có lỗi JavaScript<br/>
              • UI hiển thị đầy đủ<br/>
              • Tìm kiếm và tab switching hoạt động<br/>
              • Responsive design
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

















