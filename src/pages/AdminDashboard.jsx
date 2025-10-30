import React from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, 
  Users, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  BarChart3,
  TrendingUp,
  MessageSquare,
  Flag,
  Settings,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await customAPI.auth.me();
        if (!currentUser.is_admin) {
          window.location.href = "/";
        }
        setUser(currentUser);
      } catch (error) {
        window.location.href = "/";
      }
    };
    loadUser();
  }, []);

  // Fetch data for dashboard
  const { data: systemStats } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: () => customAPI.entities.Analytics.getSystemStats(),
    initialData: {
      totalUsers: 0,
      totalSpaces: 0,
      totalEvents: 0,
      totalBookings: 0,
      pendingApprovals: 0,
      reportsCount: 0
    }
  });

  const { data: pendingSpaces } = useQuery({
    queryKey: ['admin-pending-spaces'],
    queryFn: () => customAPI.entities.Space.find({ approved: false }),
    initialData: []
  });

  const { data: pendingEvents } = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn: () => customAPI.entities.Event.find({ approved: false }),
    initialData: []
  });

  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => customAPI.entities.Report.find({ resolved: false }),
    initialData: []
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => customAPI.entities.Analytics.getConversionRates(),
    initialData: {
      spaceConversion: 0,
      eventConversion: 0,
      bookingConversion: 0
    }
  });

  // Mutations
  const approveSpaceMutation = useMutation({
    mutationFn: (spaceId) => customAPI.entities.Space.update(spaceId, { approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pending-spaces']);
      queryClient.invalidateQueries(['admin-system-stats']);
    }
  });

  const rejectSpaceMutation = useMutation({
    mutationFn: ({ spaceId, reason }) => customAPI.entities.Space.update(spaceId, { 
      approved: false, 
      rejection_reason: reason 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pending-spaces']);
    }
  });

  const approveEventMutation = useMutation({
    mutationFn: (eventId) => customAPI.entities.Event.approve(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pending-events']);
      queryClient.invalidateQueries(['admin-system-stats']);
    }
  });

  const rejectEventMutation = useMutation({
    mutationFn: ({ eventId, reason }) => customAPI.entities.Event.reject(eventId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pending-events']);
    }
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ reportId, action }) => customAPI.entities.Report.resolve(reportId, action),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
    }
  });

  if (!user) return null;

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "spaces", label: "Không gian", icon: MapPin },
    { id: "events", label: "Sự kiện", icon: Calendar },
    { id: "reports", label: "Báo cáo", icon: Flag },
    { id: "analytics", label: "Phân tích", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600">Quản lý hệ thống Music Space</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">Xin chào, {user.full_name}</p>
              <p className="text-xs text-gray-500">Quản trị viên</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tổng người dùng</p>
                      <p className="text-3xl font-bold text-gray-800">{systemStats.totalUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Không gian</p>
                      <p className="text-3xl font-bold text-gray-800">{systemStats.totalSpaces}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sự kiện</p>
                      <p className="text-3xl font-bold text-gray-800">{systemStats.totalEvents}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Đặt chỗ</p>
                      <p className="text-3xl font-bold text-gray-800">{systemStats.totalBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Pending Approvals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Chờ duyệt</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                      {systemStats.pendingApprovals}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Không gian mới</span>
                      </div>
                      <span className="text-sm text-gray-600">{pendingSpaces.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">Sự kiện mới</span>
                      </div>
                      <span className="text-sm text-gray-600">{pendingEvents.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Báo cáo</h3>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                      {systemStats.reportsCount}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Flag className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium">Cần xử lý</span>
                      </div>
                      <span className="text-sm text-gray-600">{reports.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "spaces" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý không gian</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800">Chờ duyệt</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {pendingSpaces.map((space) => (
                    <div key={space.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{space.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{space.address}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Đăng bởi: {space.owner_name} • {format(new Date(space.created_at), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => approveSpaceMutation.mutate(space.id)}
                            disabled={approveSpaceMutation.isPending}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Lý do từ chối:");
                              if (reason) {
                                rejectSpaceMutation.mutate({ spaceId: space.id, reason });
                              }
                            }}
                            disabled={rejectSpaceMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Quản lý sự kiện</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800">Chờ duyệt</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {pendingEvents.map((event) => (
                    <div key={event.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{event.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(event.date), "dd/MM/yyyy", { locale: vi })} • {event.time}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => approveEventMutation.mutate(event.id)}
                            disabled={approveEventMutation.isPending}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Lý do từ chối:");
                              if (reason) {
                                rejectEventMutation.mutate({ eventId: event.id, reason });
                              }
                            }}
                            disabled={rejectEventMutation.isPending}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Báo cáo vi phạm</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800">Cần xử lý</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <div key={report.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{report.report_type}</h4>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Báo cáo bởi: {report.reporter_name} • {format(new Date(report.created_at), "dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => resolveReportMutation.mutate({ reportId: report.id, action: "warn" })}
                            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                          >
                            Cảnh báo
                          </button>
                          <button
                            onClick={() => resolveReportMutation.mutate({ reportId: report.id, action: "hide" })}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Ẩn nội dung
                          </button>
                          <button
                            onClick={() => resolveReportMutation.mutate({ reportId: report.id, action: "dismiss" })}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Phân tích hệ thống</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỷ lệ chuyển đổi</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Không gian</span>
                        <span>{analytics.spaceConversion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${analytics.spaceConversion}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Sự kiện</span>
                        <span>{analytics.eventConversion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${analytics.eventConversion}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Đặt chỗ</span>
                        <span>{analytics.bookingConversion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${analytics.bookingConversion}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

























