
import React from "react";
import { customAPI } from "@/api/customClient";
import { createPageUrl } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Users, TrendingUp, Clock, CheckCircle, XCircle, Download, Calendar, Loader2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function NewsletterManagement() {
  const [user, setUser] = React.useState(null);
  const [sendingNewsletter, setSendingNewsletter] = React.useState(false);
  const [newsletterResult, setNewsletterResult] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState(''); // Add search query state
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await customAPI.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl("Home");
        }
        setUser(currentUser);
      } catch (error) {
        window.location.href = createPageUrl("Home");
      }
    };
    loadUser();
  }, []);

  const { data: subscribers } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: () => customAPI.entities.Newsletter.find(),
    initialData: [],
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async () => {
      const response = await customAPI.functions.sendNewsletter({});
      return response.data;
    },
    onSuccess: (data) => {
      setNewsletterResult(data);
      setSendingNewsletter(false);
      queryClient.invalidateQueries(['newsletter-subscribers']);
    },
    onError: (error) => {
      alert('Lỗi khi gửi newsletter: ' + error.message);
      setSendingNewsletter(false);
    }
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (id) => customAPI.entities.Newsletter.update(id, { subscribed: false }),
    onSuccess: () => queryClient.invalidateQueries(['newsletter-subscribers']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customAPI.entities.Newsletter.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['newsletter-subscribers']),
  });

  const handleSendNewsletter = () => {
    const activeCount = subscribers.filter(s => s.subscribed).length;
    if (confirm(`Bạn có chắc muốn gửi newsletter đến ${activeCount} người đăng ký?`)) {
      setSendingNewsletter(true);
      setNewsletterResult(null);
      sendNewsletterMutation.mutate();
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Email', 'Tên', 'Đăng ký lúc', 'Trạng thái'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.name || '',
        format(new Date(s.created_date), 'dd/MM/yyyy HH:mm'),
        s.subscribed ? 'Active' : 'Unsubscribed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (!user) return null;

  const activeSubscribers = subscribers.filter(s => s.subscribed);
  const unsubscribed = subscribers.filter(s => !s.subscribed);

  // Add filtering logic for subscribers
  const filteredSubscribers = subscribers.filter(sub =>
    !searchQuery ||
    (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📧 Newsletter Management</h1>
          <p className="text-gray-600">Quản lý danh sách đăng ký và gửi newsletter hàng tuần</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-10 h-10 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{activeSubscribers.length}</p>
            <p className="text-sm text-gray-600">Active Subscribers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <Mail className="w-10 h-10 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{subscribers.length}</p>
            <p className="text-sm text-gray-600">Total Signups</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">{unsubscribed.length}</p>
            <p className="text-sm text-gray-600">Unsubscribed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {subscribers.length > 0 ? ((activeSubscribers.length / subscribers.length) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600">Retention Rate</p>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Gửi Newsletter</h3>
              <p className="text-sm text-gray-600">
                Gửi email tổng hợp sự kiện, blog posts mới và không gian mới trong tuần
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={handleSendNewsletter}
                disabled={sendingNewsletter || activeSubscribers.length === 0}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                {sendingNewsletter ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Gửi Newsletter Ngay
                  </>
                )}
              </button>
            </div>
          </div>

          {newsletterResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 mb-1">✅ Newsletter đã gửi thành công!</p>
                  <p className="text-sm text-green-700">
                    Đã gửi: {newsletterResult.sent} | Thất bại: {newsletterResult.failed} | Tổng: {newsletterResult.total}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Automation Guide */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100 mb-8">
          <div className="flex items-start gap-4">
            <Clock className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">🤖 Tự động hóa Newsletter</h3>
              <p className="text-gray-700 mb-4">
                Để gửi newsletter tự động mỗi tuần, bạn cần setup cron job:
              </p>
              <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                <p className="text-sm font-mono text-gray-800 mb-2">
                  Cron expression: <code className="bg-gray-100 px-2 py-1 rounded">0 9 * * 1</code>
                </p>
                <p className="text-xs text-gray-600">(Mỗi thứ 2 lúc 9:00 sáng)</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Bước 1:</strong> Vào Dashboard → Code → Functions → sendNewsletter
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Bước 2:</strong> Copy function URL
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Bước 3:</strong> Setup cron job (dùng cron-job.org hoặc similar service)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribers List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            📋 Danh sách Subscribers ({filteredSubscribers.length} hiển thị)
          </h3>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email hoặc tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
            />
          </div>

          <div className="space-y-3">
            {filteredSubscribers.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "Không tìm thấy người đăng ký nào trùng khớp." : "Chưa có ai đăng ký newsletter"}
                </p>
              </div>
            ) : (
              filteredSubscribers.map((sub) => (
                <div
                  key={sub.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    sub.subscribed
                      ? 'border-gray-200 hover:border-blue-300 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      sub.subscribed ? 'bg-blue-100' : 'bg-gray-200'
                    }`}>
                      <Mail className={`w-5 h-5 ${sub.subscribed ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{sub.email}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {sub.name && <span>👤 {sub.name}</span>}
                        <span>📅 {format(new Date(sub.created_date), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                        {!sub.subscribed && <span className="text-red-600">❌ Đã hủy</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {sub.subscribed && (
                      <button
                        onClick={() => {
                          if (confirm(`Hủy đăng ký cho ${sub.email}?`)) {
                            unsubscribeMutation.mutate(sub.id);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-sm font-medium transition-colors">
                        Unsubscribe
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Xóa vĩnh viễn ${sub.email}?`)) {
                          deleteMutation.mutate(sub.id);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition-colors">
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
