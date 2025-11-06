import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Create a client
const queryClient = new QueryClient()

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
          <h1>Đã xảy ra lỗi</h1>
          <p>{this.state.error?.message || 'Có lỗi xảy ra khi tải trang'}</p>
          <button onClick={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}>
            Refresh trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Pages />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App 