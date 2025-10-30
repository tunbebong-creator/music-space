import React from "react";
import { X, Flag, AlertTriangle, Shield, MessageSquare, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReportModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  targetType = "space", // "space" or "event"
  targetId = null,
  targetName = "",
  user
}) {
  const [reportData, setReportData] = React.useState({
    report_type: "",
    description: "",
    target_type: targetType,
    target_id: targetId,
    reporter_id: user?.id,
    reporter_name: user?.full_name || user?.email,
    severity: "medium"
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reportTypes = [
    {
      value: "inappropriate_content",
      label: "Nội dung không phù hợp",
      description: "Nội dung có thể gây khó chịu hoặc không phù hợp",
      icon: AlertTriangle,
      color: "red"
    },
    {
      value: "spam",
      label: "Spam",
      description: "Nội dung lặp lại hoặc quảng cáo không mong muốn",
      icon: MessageSquare,
      color: "orange"
    },
    {
      value: "fake_information",
      label: "Thông tin sai sự thật",
      description: "Thông tin không chính xác hoặc gây hiểu lầm",
      icon: Eye,
      color: "yellow"
    },
    {
      value: "harassment",
      label: "Quấy rối",
      description: "Hành vi quấy rối hoặc đe dọa",
      icon: Shield,
      color: "purple"
    },
    {
      value: "copyright_violation",
      label: "Vi phạm bản quyền",
      description: "Sử dụng hình ảnh hoặc nội dung không có quyền",
      icon: Flag,
      color: "blue"
    },
    {
      value: "other",
      label: "Khác",
      description: "Lý do khác không có trong danh sách",
      icon: Flag,
      color: "gray"
    }
  ];

  const severityLevels = [
    { value: "low", label: "Thấp", description: "Có thể bỏ qua" },
    { value: "medium", label: "Trung bình", description: "Cần xem xét" },
    { value: "high", label: "Cao", description: "Cần xử lý ngay" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportData.report_type) {
      alert("Vui lòng chọn loại báo cáo");
      return;
    }

    if (!reportData.description.trim()) {
      alert("Vui lòng mô tả chi tiết về vấn đề");
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(reportData);
      }
      
      // Reset form
      setReportData({
        report_type: "",
        description: "",
        target_type: targetType,
        target_id: targetId,
        reporter_id: user?.id,
        reporter_name: user?.full_name || user?.email,
        severity: "medium"
      });
      
      onClose();
      alert("Cảm ơn bạn đã báo cáo! Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.");
    } catch (error) {
      console.error("Report submission error:", error);
      alert("Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      red: "bg-red-100 text-red-700 border-red-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      gray: "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[color] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Báo cáo nội dung</h2>
                  <p className="text-gray-600">{targetName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Loại báo cáo *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReportData({ ...reportData, report_type: type.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      reportData.report_type === type.value
                        ? `${getColorClasses(type.color)} border-current`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <type.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Level */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Mức độ nghiêm trọng</h3>
              <div className="flex gap-3">
                {severityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setReportData({ ...reportData, severity: level.value })}
                    className={`px-4 py-3 rounded-xl border-2 text-center transition-all ${
                      reportData.severity === level.value
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Mô tả chi tiết *</h3>
              <textarea
                value={reportData.description}
                onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500"
                placeholder="Vui lòng mô tả chi tiết về vấn đề bạn gặp phải. Thông tin này sẽ giúp chúng tôi xử lý nhanh chóng và chính xác hơn."
                required
              />
              <p className="text-xs text-gray-500">
                Tối thiểu 20 ký tự. Thông tin bạn cung cấp sẽ được bảo mật và chỉ sử dụng để xử lý báo cáo.
              </p>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-800 mb-2">Thông tin bổ sung</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Báo cáo cho:</strong> {targetName}</p>
                <p><strong>Loại:</strong> {targetType === "space" ? "Không gian" : "Sự kiện"}</p>
                <p><strong>Người báo cáo:</strong> {user?.full_name || user?.email}</p>
                <p><strong>Thời gian:</strong> {new Date().toLocaleString("vi-VN")}</p>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">Hướng dẫn báo cáo</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Chỉ báo cáo nội dung thực sự vi phạm quy định</li>
                <li>• Cung cấp thông tin chính xác và chi tiết</li>
                <li>• Không lạm dụng chức năng báo cáo</li>
                <li>• Báo cáo sai có thể dẫn đến hạn chế tài khoản</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reportData.report_type || !reportData.description.trim()}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Flag className="w-5 h-5" />
                    Gửi báo cáo
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

























