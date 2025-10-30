import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  
  // Logic hiển thị số trang (mobile-friendly)
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
      {/* Previous Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-medium transition-all touch-manipulation flex items-center gap-1 md:gap-2 text-sm md:text-base ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden md:inline">Trước</span>
      </motion.button>

      {/* Page Numbers */}
      {startPage > 1 && (
        <>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(1)}
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-medium hover:border-blue-500 hover:text-blue-600 transition-all touch-manipulation text-sm md:text-base"
          >
            1
          </motion.button>
          {startPage > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <motion.button
          key={page}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 md:w-10 md:h-10 rounded-xl font-medium transition-all touch-manipulation text-sm md:text-base ${
            currentPage === page
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600'
          }`}
        >
          {page}
        </motion.button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-medium hover:border-blue-500 hover:text-blue-600 transition-all touch-manipulation text-sm md:text-base"
          >
            {totalPages}
          </motion.button>
        </>
      )}

      {/* Next Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-medium transition-all touch-manipulation flex items-center gap-1 md:gap-2 text-sm md:text-base ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 shadow-sm'
        }`}
      >
        <span className="hidden md:inline">Sau</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}