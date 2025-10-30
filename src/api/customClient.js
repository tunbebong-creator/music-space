// Custom API client to replace base44
class CustomAPI {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // Support both legacy and new token keys
    this.authToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
  }

  // Set authentication token
  setAuthToken(token) {
    this.authToken = token;
    // Store under both keys for compatibility
    localStorage.setItem('auth_token', token);
    localStorage.setItem('authToken', token);
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Always get fresh token from localStorage
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  auth = {
    me: async () => {
      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }
      
      try {
        const response = await this.request('/auth/me', { method: 'GET' });
        return response;
      } catch (error) {
        return null;
      }
    },
    
    login: async (email, password) => {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    },
    
    register: async (userData) => {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    },
    
    logout: () => {
      this.clearAuthToken();
      localStorage.removeItem('user_data');
      window.location.href = '/';
    },
    
    updateMe: async (data) => {
      return { ...data, id: 'mock-user-1' };
    },
    
    redirectToLogin: (path) => {
      console.log('Redirect to login:', path);
    }
  };

  // Entity methods with mock data
  entities = {
    BlogPost: {
      find: (filters = {}) => this.request('/blog-posts', { method: 'GET' }),
      findById: (id) => this.request(`/blog-posts/${id}`, { method: 'GET' }),
      create: (data) => this.request('/blog-posts', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/blog-posts/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/blog-posts/${id}`, { method: 'DELETE' })
    },

    Space: {
      find: (filters = {}) => this.request('/spaces', { method: 'GET' }),
      findById: (id) => this.request(`/spaces/${id}`, { method: 'GET' }),
      create: (data) => this.request('/spaces', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/spaces/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/spaces/${id}`, { method: 'DELETE' })
    },

    Event: {
      find: (filters = {}) => this.request('/events', { method: 'GET' }),
      findById: (id) => this.request(`/events/${id}`, { method: 'GET' }),
      create: (data) => this.request('/events', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/events/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/events/${id}`, { method: 'DELETE' }),
      approve: (id) => this.request(`/events/${id}/approve`, { method: 'POST' }),
      reject: (id, reason) => this.request(`/events/${id}/reject`, { 
        method: 'POST', 
        body: JSON.stringify({ reason }) 
      })
    },

    Booking: {
      find: (filters = {}) => this.request('/bookings', { method: 'GET' }),
      findById: (id) => this.request(`/bookings/${id}`, { method: 'GET' }),
      create: (data) => this.request('/bookings', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/bookings/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/bookings/${id}`, { method: 'DELETE' }),
      approve: (id) => this.request(`/bookings/${id}/approve`, { method: 'POST' }),
      reject: (id, reason) => this.request(`/bookings/${id}/reject`, { 
        method: 'POST', 
        body: JSON.stringify({ reason }) 
      })
    },

    UserActivity: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Activity' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    UserPreferences: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Preferences' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    ArtistBooking: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Artist Booking' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    RoleRequest: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Role Request' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    EventRegistration: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Event Registration' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    MoodJournal: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Mood Journal' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    Review: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Review' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    ContactMessage: {
      find: (filters = {}) => this.request('/contact-messages', { method: 'GET' }),
      findById: (id) => this.request(`/contact-messages/${id}`, { method: 'GET' }),
      create: (data) => {
        console.log('📧 ContactMessage.create called with:', data);
        return this.request('/contact-messages', { 
          method: 'POST', 
          body: JSON.stringify(data) 
        });
      },
      update: (id, data) => this.request(`/contact-messages/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/contact-messages/${id}`, { method: 'DELETE' })
    },

    Newsletter: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Newsletter' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    Voucher: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Voucher' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    },

    // LOVE Module Entities
    EventRegistration: {
      find: (filters = {}) => this.request('/event-registrations', { method: 'GET' }),
      findById: (id) => this.request(`/event-registrations/${id}`, { method: 'GET' }),
      create: (data) => this.request('/event-registrations', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/event-registrations/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/event-registrations/${id}`, { method: 'DELETE' })
    },

    SpaceFollow: {
      find: (filters = {}) => this.request('/space-follows', { method: 'GET' }),
      create: (data) => this.request('/space-follows', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/space-follows/${id}`, { method: 'DELETE' })
    },

    ArtistRequest: {
      find: (filters = {}) => this.request('/artist-requests', { method: 'GET' }),
      findById: (id) => this.request(`/artist-requests/${id}`, { method: 'GET' }),
      create: (data) => this.request('/artist-requests', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/artist-requests/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/artist-requests/${id}`, { method: 'DELETE' }),
      approve: (id) => this.request(`/artist-requests/${id}/approve`, { method: 'POST' }),
      reject: (id, reason) => this.request(`/artist-requests/${id}/reject`, { 
        method: 'POST', 
        body: JSON.stringify({ reason }) 
      })
    },

    Review: {
      find: (filters = {}) => this.request('/reviews', { method: 'GET' }),
      findById: (id) => this.request(`/reviews/${id}`, { method: 'GET' }),
      create: (data) => this.request('/reviews', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/reviews/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/reviews/${id}`, { method: 'DELETE' })
    },

    Notification: {
      find: (filters = {}) => this.request('/notifications', { method: 'GET' }),
      findById: (id) => this.request(`/notifications/${id}`, { method: 'GET' }),
      create: (data) => this.request('/notifications', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/notifications/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/notifications/${id}`, { method: 'DELETE' }),
      markAsRead: (id) => this.request(`/notifications/${id}/read`, { method: 'POST' }),
      markAllAsRead: () => this.request('/notifications/mark-all-read', { method: 'POST' })
    },

    Report: {
      find: (filters = {}) => this.request('/reports', { method: 'GET' }),
      findById: (id) => this.request(`/reports/${id}`, { method: 'GET' }),
      create: (data) => this.request('/reports', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id, data) => this.request(`/reports/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id) => this.request(`/reports/${id}`, { method: 'DELETE' }),
      resolve: (id, action) => this.request(`/reports/${id}/resolve`, { 
        method: 'POST', 
        body: JSON.stringify({ action }) 
      })
    },

    Analytics: {
      getSpaceStats: (spaceId) => this.request(`/analytics/spaces/${spaceId}`, { method: 'GET' }),
      getEventStats: (eventId) => this.request(`/analytics/events/${eventId}`, { method: 'GET' }),
      getSystemStats: () => this.request('/analytics/system', { method: 'GET' }),
      getConversionRates: () => this.request('/analytics/conversion', { method: 'GET' }),
      getEmotionAnalytics: () => this.request('/analytics/emotions', { method: 'GET' })
    },

    GeneratedMusic: {
      find: (filters = {}) => Promise.resolve([]),
      findById: (id) => Promise.resolve({ id, name: 'Sample Generated Music' }),
      create: (data) => Promise.resolve({ id: 'new-id', ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ success: true })
    }
  };

  // Function methods
  functions = {
    sendBookingConfirmation: async (bookingData) => {
      return Promise.resolve({ success: true, data: bookingData });
    },

    sendEventReminder: async (eventData) => {
      return Promise.resolve({ success: true, data: eventData });
    },

    sendWelcomeEmail: async (userData) => {
      return Promise.resolve({ success: true, data: userData });
    },

    notifySpaceApproval: async (spaceData) => {
      return Promise.resolve({ success: true, data: spaceData });
    },

    sendNewsletter: async (newsletterData) => {
      return Promise.resolve({ success: true, data: newsletterData });
    },

    generateAnalytics: async (analyticsData) => {
      return Promise.resolve({ success: true, data: analyticsData });
    }
  };
}

// Create and export the custom API client
export const customAPI = new CustomAPI();