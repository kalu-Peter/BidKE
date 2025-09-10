/**
 * API Service for BidLode
 * Handles all HTTP requests to the backend API
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: number;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  full_name: string;
  phone: string;
  status: string;
  is_verified: boolean;
  created_at: string;
}

interface LoginResponse {
  user: User;
  session_token: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'buyer' | 'seller';
  full_name: string;
  phone: string;
  // Optional buyer fields
  national_id?: string;
  date_of_birth?: string;
  address?: string;
  // Optional seller fields
  business_name?: string;
  business_type?: string;
  business_registration?: string;
  tax_pin?: string;
  business_address?: string;
  business_phone?: string;
}

interface Auction {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  starting_price: number;
  current_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  seller_id: number;
  seller_name: string;
  image_url: string | null;
  bid_count: number;
  watcher_count: number;
  is_featured: boolean;
  is_reserve_met: boolean;
  time_remaining: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

class ApiService {
  private baseUrl: string;
  private sessionToken: string | null;

  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.sessionToken = localStorage.getItem('bidlode_session_token');
  }

  /**
   * Make HTTP request with proper headers
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add session token if available
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }

  /**
   * Set session token
   */
  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (token) {
      localStorage.setItem('bidlode_session_token', token);
    } else {
      localStorage.removeItem('bidlode_session_token');
    }
  }

  /**
   * User Authentication Methods
   */

  async register(data: RegisterData): Promise<ApiResponse<{ user_id: number; verification_code: string }>> {
    return this.makeRequest('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.makeRequest<LoginResponse>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (result.success && result.data) {
      this.setSessionToken(result.data.session_token);
      localStorage.setItem('bidlode_user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.makeRequest('/auth/logout.php', {
      method: 'POST'
    });

    if (result.success) {
      this.setSessionToken(null);
      localStorage.removeItem('bidlode_user');
    }

    return result;
  }

  async verifyEmail(email: string, verification_code: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/verify.php', {
      method: 'POST',
      body: JSON.stringify({ email, verification_code })
    });
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/verify.php?action=resend', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Auction Methods
   */

  async getAuctions(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    status?: string;
  } = {}): Promise<ApiResponse<{ auctions: Auction[]; total: number }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.makeRequest(`/auctions/list.php?${queryParams.toString()}`);
  }

  async getAuction(id: number): Promise<ApiResponse<Auction>> {
    return this.makeRequest(`/auctions/detail.php?id=${id}`);
  }

  async placeBid(auctionId: number, amount: number): Promise<ApiResponse> {
    return this.makeRequest('/auctions/bid.php', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId, bid_amount: amount })
    });
  }

  /**
   * Category Methods
   */

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.makeRequest('/auctions/categories.php');
  }

  /**
   * Watchlist Methods
   */

  async getWatchlist(): Promise<ApiResponse<{ auction_id: number }[]>> {
    return this.makeRequest('/auctions/watchlist.php');
  }

  async addToWatchlist(auctionId: number): Promise<ApiResponse> {
    return this.makeRequest('/auctions/watchlist.php', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId, action: 'add' })
    });
  }

  async removeFromWatchlist(auctionId: number): Promise<ApiResponse> {
    return this.makeRequest('/auctions/watchlist.php', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId, action: 'remove' })
    });
  }

  /**
   * User Profile Methods
   */

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest('/auth/profile.php');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse> {
    return this.makeRequest('/auth/profile.php', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Upload Methods
   */

  async uploadFile(file: File, type: 'avatar' | 'auction' | 'document'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.makeRequest('/upload.php', {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type for FormData
    });
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, User, RegisterData, Auction, Category };
