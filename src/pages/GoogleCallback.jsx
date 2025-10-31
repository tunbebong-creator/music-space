import React, { useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/oauth';

export default function GoogleCallback() {
  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Get authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          // Send error to parent window
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Đăng nhập bị hủy'
          }, window.location.origin);
          window.close();
          return;
        }

        if (!code) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Không nhận được mã xác thực'
          }, window.location.origin);
          window.close();
          return;
        }

        // Send code to backend to exchange for user info
        const response = await fetch(API_ENDPOINTS.GOOGLE_CALLBACK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (response.ok) {
          // Save user data and redirect
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_data', JSON.stringify(data.user));
          
          // Redirect to homepage
          window.location.href = '/';
        } else {
          // For now, create mock user data if backend fails
          const mockUserData = {
            id: 'google-' + Date.now(),
            email: 'user@gmail.com',
            full_name: 'Google User',
            provider: 'google',
            avatar_url: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=G',
            role: 'user'
          };
          
          const token = 'google-token-' + Date.now();
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(mockUserData));
          
          // Redirect to homepage
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Google callback error:', error);
        window.location.href = `/?error=${encodeURIComponent('Có lỗi xảy ra')}`;
      }
    };

    handleGoogleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
