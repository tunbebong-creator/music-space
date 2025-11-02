import React from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar, 
  Heart, 
  Star,
  Eye,
  MousePointer,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyticsDashboard({ 
  spaceId = null, 
  eventId = null, 
  timeRange = "30d" 
}) {
  const [analytics, setAnalytics] = React.useState({
    views: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    ratings: 0,
    reviews: 0,
    followers: 0,
    bookings: 0,
    events: 0,
    conversionRate: 0,
    engagementRate: 0,
    satisfactionScore: 0
  });

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in real app, this would come from API
        setAnalytics({
          views: Math.floor(Math.random() * 10000) + 1000,
          clicks: Math.floor(Math.random() * 1000) + 100,
          conversions: Math.floor(Math.random() * 100) + 10,
          revenue: Math.floor(Math.random() * 50000) + 5000,
          ratings: Math.floor(Math.random() * 500) + 50,
          reviews: Math.floor(Math.random() * 200) + 20,
          followers: Math.floor(Math.random() * 1000) + 100,
          bookings: Math.floor(Math.random() * 100) + 10,
          events: Math.floor(Math.random() * 50) + 5,
          conversionRate: Math.floor(Math.random() * 20) + 5,
          engagementRate: Math.floor(Math.random() * 30) + 10,
          satisfactionScore: Math.floor(Math.random() * 2) + 4
        });
      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [spaceId, eventId, timeRange]);

  const metrics = [
    {
      title: "Lượt xem",
      value: analytics.views.toLocaleString(),
      icon: Eye,
      color: "blue",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Lượt click",
      value: analytics.clicks.toLocaleString(),
      icon: MousePointer,
      color: "green",
      change: "+8%",
      trend: "up"
    },
    {
      title: "Chuyển đổi",
      value: analytics.conversions.toLocaleString(),
      icon: TrendingUp,
      color: "purple",
      change: "+15%",
      trend: "up"
    },
    {
      title: "Doanh thu",
      value: `${analytics.revenue.toLocaleString()} VNĐ`,
      icon: DollarSign,
      color: "yellow",
      change: "+22%",
      trend: "up"
    },
    {
      title: "Đánh giá",
      value: analytics.ratings.toLocaleString(),
      icon: Star,
      color: "orange",
      change: "+5%",
      trend: "up"
    },
    {
      title: "Người theo dõi",
      value: analytics.followers.toLocaleString(),
      icon: Heart,
      color: "pink",
      change: "+18%",
      trend: "up"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      yellow: "bg-yellow-100 text-yellow-600",
      orange: "bg-orange-100 text-orange-600",
      pink: "bg-pink-100 text-pink-600"
    };
    return colors[color] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Phân tích hiệu suất</h2>
          <p className="text-gray-600">
            {spaceId ? "Không gian" : eventId ? "Sự kiện" : "Tổng quan hệ thống"} • {timeRange}
          </p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${getColorClasses(metric.color)} flex items-center justify-center`}>
                <metric.icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-medium ${
                metric.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{metric.value}</div>
            <div className="text-xs text-gray-600">{metric.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỷ lệ chuyển đổi</h3>
          <div className="text-3xl font-bold text-gray-800 mb-2">{analytics.conversionRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${analytics.conversionRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Từ {analytics.clicks.toLocaleString()} clicks đến {analytics.conversions.toLocaleString()} chuyển đổi
          </p>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỷ lệ tương tác</h3>
          <div className="text-3xl font-bold text-gray-800 mb-2">{analytics.engagementRate}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${analytics.engagementRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Dựa trên {analytics.followers.toLocaleString()} người theo dõi
          </p>
        </div>

        {/* Satisfaction Score */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Điểm hài lòng</h3>
          <div className="text-3xl font-bold text-gray-800 mb-2">{analytics.satisfactionScore}/5</div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= analytics.satisfactionScore
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Từ {analytics.reviews.toLocaleString()} đánh giá
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lượt xem theo thời gian</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Biểu đồ sẽ được hiển thị ở đây</p>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân tích doanh thu</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Đặt chỗ không gian</span>
              <span className="font-semibold text-gray-800">
                {Math.floor(analytics.revenue * 0.6).toLocaleString()} VNĐ
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vé sự kiện</span>
              <span className="font-semibold text-gray-800">
                {Math.floor(analytics.revenue * 0.3).toLocaleString()} VNĐ
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: "30%" }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dịch vụ khác</span>
              <span className="font-semibold text-gray-800">
                {Math.floor(analytics.revenue * 0.1).toLocaleString()} VNĐ
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: "10%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nội dung hiệu suất cao</h3>
        <div className="space-y-3">
          {[
            { name: "Acoustic Night tại Café Sài Gòn", views: 2500, type: "event" },
            { name: "Studio Hòa Lạc", views: 1800, type: "space" },
            { name: "Jazz Workshop", views: 1200, type: "event" },
            { name: "Music Space Đà Nẵng", views: 950, type: "space" }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.type === "event" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {item.type === "event" ? <Calendar className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.type === "event" ? "Sự kiện" : "Không gian"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{item.views.toLocaleString()}</div>
                <div className="text-sm text-gray-600">lượt xem</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

































