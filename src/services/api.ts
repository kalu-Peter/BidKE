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
  username: string;
  email: string;
  phone: string;
  status: string;
  is_verified: boolean;
  created_at: string;
}

interface LoginResponse {
  user: User;
  token: string;
  roles: Array<{
    role_name: string;
    role_display_name: string;
    is_primary: boolean;
    role_status: string;
    can_login: boolean;
  }>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

interface AdminRegisterData extends RegisterData {
  fullName: string;
}

interface AdminRegisterResponse {
  user_id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface Auction {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name: string;
  category?: string; // Alias for category_name
  starting_price: number;
  current_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
  start_time?: string; // For auction scheduling
  end_time?: string; // For auction scheduling
  status: 'draft' | 'active' | 'ended' | 'cancelled' | 'live' | 'approved' | 'pending' | 'sold';
  seller_id: number;
  seller_name: string;
  image_url: string | null;
  image_path?: string; // From auction_files
  primary_image?: string; // Primary image URL from auction_images
  images?: Array<string | { image_url: string; image_path?: string }>; // Updated to support string array
  bid_count: number;
  watcher_count: number;
  is_featured: boolean;
  featured?: boolean; // Alias for is_featured
  is_reserve_met: boolean;
  time_remaining: number;
  auction_ended?: boolean;
  // Properties for sold auctions
  winning_amount?: number;
  winner_id?: number;
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
    this.baseUrl = 'https://bidke-php.onrender.com/api'; // Change to your actual API base URL
    this.sessionToken = localStorage.getItem('bidlode_session_token');
  }

  /**
   * Make HTTP request with proper headers
   * https://bidke-php.onrender.com
   * http://localhost:8000
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

      // Read raw text once (response.text() can only be read once) and try to parse JSON
      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (jsonErr) {
        // Not JSON - leave data as null but keep raw for debugging
        data = null;
      }

      if (!response.ok) {
        // Detailed error logging for failed responses
        console.error('API Error response', {
          url,
          status: response.status,
          statusText: response.statusText,
          raw,
          data
        });

        // If we parsed JSON with error details, include them; otherwise include raw
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}`;
        return Object.assign({ success: false, error: errorMsg, raw }, data || {});
      }

      // Successful response: prefer parsed data when available, otherwise return raw
      if (data !== null) return data as ApiResponse<T>;
      // If response had no JSON body but was OK, return a generic success
      return { success: true, data: (raw ? raw : undefined) } as ApiResponse<any>;
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      } as ApiResponse;
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

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; roles: string[]; verification_code: string }>> {
    return this.makeRequest('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.makeRequest<LoginResponse>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (result.success && result.data) {
      // Save session token
      this.setSessionToken(result.data.token);

      // Normalize roles/available_roles and login_role
      const roles = (result.data as any).available_roles || (result.data as any).roles || [];
      const loginRole = (result.data as any).login_role || (roles && roles[0] && roles[0].role_name) || 'buyer';

      // Store a richer user object so front-end can restore role/roles on refresh
      const storedUser = {
        ...(result.data.user || {}),
        roles,
        role: loginRole
      };

      localStorage.setItem('bidlode_user', JSON.stringify(storedUser));
    }

    return result;
  }

  /**
   * Create admin user (uses backend admin-signup.php)
   */
  async createAdminUser(data: AdminRegisterData): Promise<ApiResponse<AdminRegisterResponse>> {
    return this.makeRequest('/auth/admin-signup.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
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

    return this.makeRequest(`/auctions.php?${queryParams.toString()}`);
  }

  async getAuction(id: number): Promise<ApiResponse<Auction>> {
    return this.makeRequest(`/auctions/detail.php?id=${id}`);
  }

  async placeBid(auctionId: number, amount: number, userId?: number): Promise<ApiResponse> {
    // Prefer explicit userId, otherwise try dev fallback from localStorage
    let uid = userId;
    if (!uid) {
      const storedUserRaw = localStorage.getItem('bidlode_user');
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      if (storedUser && storedUser.id) uid = storedUser.id;
    }

    const body: any = { auction_id: auctionId, bid_amount: amount };
    if (uid) body.user_id = uid;

    const res = await this.makeRequest('/place-bid.php', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // If successful, dispatch a global event so other components can refresh their bid lists
    if (res && res.success) {
      try {
        if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
          const ev = new CustomEvent('bids:changed', { detail: { auction_id: auctionId, bid_amount: amount } });
          (window as any).dispatchEvent(ev);
        }
      } catch (_) {}
    }

    return res;
  }

  /**
   * Get buyer and seller bid summaries for the authenticated user
   */
  async getMyBids(): Promise<ApiResponse<{ buyer_bids: any[]; seller_listings: any[] }>> {
    return this.makeRequest('/bids.php');
  }

  async getWonAuctions(): Promise<ApiResponse<{ id: number; title: string; winning_amount: number; status: string; end_time: string; location?: string; primary_image?: string }[]>> {
    return this.makeRequest('/won-auctions.php');
  }

  /**
   * Process a payment for a won auction. Backend endpoint should create payment, commission and payout records.
   */
  async processPayment(auctionId: number, amount: number, payment_method?: string, metadata?: any): Promise<ApiResponse<{ payment_id?: string }>> {
    const body: any = { auction_id: auctionId, amount };
    if (payment_method) body.payment_method = payment_method;
    if (metadata) body.metadata = metadata;
    return this.makeRequest('/payments/process.php', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Initiate a payment for a finalized auction (server creates a pending payment and returns transaction_ref)
   */
  async initiateAuctionPayment(auctionId: number): Promise<ApiResponse<{ payment_id?: number; transaction_ref?: string }>> {
    return this.makeRequest('/payments/process_auction.php', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId })
    });
  }

  // Admin: get paginated won auctions (uses admin/won_auctions.php)
  async adminGetWonAuctions(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{ winner_record_id: number; auction_id: number; auction_title: string; winning_amount: number; won_at: string; winner_id?: number; winner_username?: string; seller_id?: number; seller_name?: string }[] & { total?: number }>> {
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    const url = `/admin/won_auctions.php?${qp.toString()}`;
    return this.makeRequest(url);
  }

  // Admin: list pending payments for manual confirmation
  async adminListPendingPayments(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<any[]>> {
    const q = new URLSearchParams();
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));
    return this.makeRequest(`/payments/admin/list_pending.php?${q.toString()}`);
  }

  // Admin: confirm a pending payment (idempotent)
  async adminConfirmPayment(paymentId: number): Promise<ApiResponse> {
    return this.makeRequest('/payments/admin/confirm.php', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId })
    });
  }

  // Dev: mark payment completed in development (calls api/payments/dev_confirm.php)
  // Only intended for local development when DEV_MODE is enabled on the backend.
  async devConfirmPayment(transactionRef?: string, paymentId?: number): Promise<ApiResponse> {
    const body: any = {};
    if (transactionRef) body.transaction_ref = transactionRef;
    if (paymentId) body.payment_id = paymentId;
    return this.makeRequest('/payments/dev_confirm.php', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // Admin: delete a winner record by id
  async adminDeleteWinner(id: number): Promise<ApiResponse> {
    return this.makeRequest('/admin/won_auctions.php', {
      method: 'DELETE',
      body: JSON.stringify({ id })
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

  async getWatchlist(userId?: number): Promise<ApiResponse<{ auction_id: number }[]>> {
    // If userId provided by caller, use it. Otherwise fall back to session or localStorage for dev.
    const storedUserRaw = localStorage.getItem('bidlode_user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    let url = '/watchlist.php';
    if (userId) {
      url += `?user_id=${encodeURIComponent(userId)}`;
    } else if (!this.sessionToken && storedUser && storedUser.id) {
      url += `?user_id=${encodeURIComponent(storedUser.id)}`;
    }
    return this.makeRequest(url);
  }

  async addToWatchlist(auctionId: number, userId?: number): Promise<ApiResponse> {
    // POST with auction_id; server prefers session-based user_id when present
    // Dev fallback: if there's no PHP session (server-side), include locally stored user id
    const storedUserRaw = localStorage.getItem('bidlode_user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    const body: any = { auction_id: auctionId };
    if (userId) {
      body.user_id = userId;
    } else if (!this.sessionToken && storedUser && storedUser.id) {
      // NOTE: including user_id from localStorage is a development convenience only.
      // Remove this in production and rely on server-side sessions or proper auth tokens.
      body.user_id = storedUser.id;
    }

    const res = await this.makeRequest('/watchlist.php', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (res && res.success) {
      try {
        this.dispatchWatchlistChanged({ auction_id: auctionId, watched: true });
      } catch (_) {}
    }
    return res;
  }

  async removeFromWatchlist(auctionId: number, userId?: number): Promise<ApiResponse> {
    // DELETE: send auction_id and user_id in JSON body. PHP reads user_id from $input for DELETE.
    const storedUserRaw = localStorage.getItem('bidlode_user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

    const payload: any = { auction_id: auctionId };
    if (userId) {
      payload.user_id = userId;
    } else if (!this.sessionToken && storedUser && storedUser.id) {
      payload.user_id = storedUser.id;
    }

    // Keep auction_id in query string for compatibility, but include body so PHP can read user_id
    const url = `/watchlist.php?auction_id=${encodeURIComponent(auctionId)}`;
    const res = await this.makeRequest(url, {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });
    if (res && res.success) {
      try {
        this.dispatchWatchlistChanged({ auction_id: auctionId, watched: false });
      } catch (_) {}
    }
    return res;
  }

  /**
   * Toggle watchlist state for an auction. Server will insert or delete as needed.
   */
  async toggleWatch(auctionId: number, userId?: number): Promise<ApiResponse<any>> {
    // Prefer an explicit userId passed by caller (from auth context); fall back to session token or localStorage for dev
    const storedUserRaw = localStorage.getItem('bidlode_user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    const payload: any = { auction_id: auctionId, toggle: true };

    if (userId) {
      payload.user_id = userId;
    } else if (!this.sessionToken && storedUser && storedUser.id) {
      payload.user_id = storedUser.id; // dev-only fallback
    }

    const res = await this.makeRequest('/watchlist.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res && res.success && res.data) {
      try {
        const d: any = res.data;
        this.dispatchWatchlistChanged({ auction_id: d.auction_id, watched: !!d.watched });
      } catch (_) {}
    }
    return res;
  }

  // Helper to dispatch a global event when watchlist changes so other components can refresh
  dispatchWatchlistChanged(detail: { auction_id: number; watched: boolean }) {
    try {
      if (typeof window !== 'undefined' && (window as any).dispatchEvent) {
        const ev = new CustomEvent('watchlist:changed', { detail });
        (window as any).dispatchEvent(ev);
      }
    } catch (err) {
      // ignore in non-browser environments
    }
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
   * Buyer Profile Methods
   */

  async getBuyerProfile(): Promise<ApiResponse<{
    user: {
      id: number;
      username: string;
      email: string;
      phone: string;
      status: string;
      is_verified: boolean;
      created_at: string;
      full_name?: string;
      date_of_birth?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    profile: {
      id?: number;
      user_id?: number;
      national_id?: string;
      national_id_verified?: boolean;
      preferred_categories?: string[];
      max_bid_limit?: number;
      auto_bid_enabled?: boolean;
      default_shipping_address?: string;
      preferred_payment_methods?: string[];
      total_bids?: number;
      successful_bids?: number;
      total_spent?: number;
      won_auctions?: number;
      buyer_rating?: number;
      bid_notifications?: boolean;
      outbid_notifications?: boolean;
      winning_notifications?: boolean;
      auction_ending_notifications?: boolean;
    } | null;
    stats: {
      activeBids: number;
      watchlistItems: number;
      wonAuctions: number;
      totalSpent: number;
    };
  }>> {
    return this.makeRequest('/auth/buyer-profile.php');
  }

  async updateBuyerProfile(data: {
    // User table fields
    full_name?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    // Buyer profile fields
    national_id?: string;
    preferred_categories?: string[];
    max_bid_limit?: number;
    auto_bid_enabled?: boolean;
    default_shipping_address?: string;
    preferred_payment_methods?: string[];
    bid_notifications?: boolean;
    outbid_notifications?: boolean;
    winning_notifications?: boolean;
    auction_ending_notifications?: boolean;
    // KYC fields
    kyc_type?: 'national_id' | 'passport' | 'driving_license';
    kyc_documents?: string[]; // array of document URLs
  }): Promise<ApiResponse> {
    return this.makeRequest('/auth/buyer-profile.php', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Get seller profile for the authenticated user
   */
  async getSellerProfile(): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/seller-profile.php');
  }

  /**
   * Update seller profile (business information)
   */
  async updateSellerProfile(data: {
    business_name?: string;
    business_type?: string;
    business_registration?: string;
    tax_pin?: string;
    business_permit?: string;
    business_address?: string;
    business_phone?: string;
    business_email?: string;
    website_url?: string;
    business_description?: string;
    operating_hours?: any;
    service_areas?: string[];
    specializations?: string[];
    bank_account_name?: string;
    bank_account_number?: string;
    bank_name?: string;
    bank_branch?: string;
    bank_code?: string;
    mobile_money_number?: string;
    mobile_money_provider?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/auth/seller-profile.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Upload Methods
   */

  async uploadFile(file: File, type: 'avatar' | 'auction' | 'document' = 'auction'): Promise<ApiResponse<{ url: string; filename: string; path: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    
    // Add session token if available
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/upload.php`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Submit seller verification documents and business info
   */
  async submitSellerVerification(data: { documents: string[]; notes?: string; business_name?: string; business_type?: string }): Promise<ApiResponse> {
    return this.makeRequest('/auth/seller-verify.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Admin: get pending seller verifications
   */
  async getPendingSellerVerifications(params: { limit?: number; offset?: number } = {}): Promise<ApiResponse<any[]>> {
    const q = new URLSearchParams();
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.offset) q.append('offset', params.offset.toString());
    return this.makeRequest(`/admin/seller-verifications.php?${q.toString()}`);
  }

  /**
   * Admin: fetch users with pagination and optional filters
   */
  async getUsers(params: { limit?: number; offset?: number; search?: string; role?: string; status?: string } = {}): Promise<ApiResponse<{ total: number; limit: number; offset: number; users: any[] }>> {
    const q = new URLSearchParams();
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.offset) q.append('offset', params.offset.toString());
    if (params.search) q.append('search', params.search);
    if (params.role) q.append('role', params.role);
    if (params.status) q.append('status', params.status);
    return this.makeRequest(`/admin/users.php?${q.toString()}`);
  }

  /**
   * Admin: get combined user + buyer profile details
   */
  async getUserDetails(userId: number): Promise<ApiResponse<{ user: any; profile: any }>> {
    return this.makeRequest(`/admin/user-details.php?user_id=${encodeURIComponent(userId)}`);
  }

  /**
   * Admin: approve or reject a seller verification
   */
  async reviewSellerVerification(action: 'approve' | 'reject', userId: number, notes?: string): Promise<ApiResponse> {
    return this.makeRequest('/admin/seller-verifications.php', {
      method: 'POST',
      body: JSON.stringify({ action, user_id: userId, notes })
    });
  }

  /**
   * Admin: approve or reject a user (buyer-focused). Uses buyer_profiles + users only.
   */
  async reviewUserVerification(action: 'approve' | 'reject', userId: number, message?: string): Promise<ApiResponse> {
    return this.makeRequest('/admin/user-verification.php', {
      method: 'POST',
      body: JSON.stringify({ action, user_id: userId, message })
    });
  }

  /**
   * Suspend a user (admin only)
   */
  async suspendUser(userId: number, reason?: string): Promise<ApiResponse> {
    return this.makeRequest('/admin/suspend-user.php', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, reason })
    });
  }

  /**
   * Admin: get users with verification management data
   */
  async getUsersVerificationManagement(params: { 
    limit?: number; 
    offset?: number; 
    search?: string; 
    user_status?: string; 
    verification_status?: string; 
  } = {}): Promise<ApiResponse<{users: any[], total: number, limit: number, offset: number}>> {
    const q = new URLSearchParams();
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.offset) q.append('offset', params.offset.toString());
    if (params.search) q.append('search', params.search);
    if (params.user_status) q.append('user_status', params.user_status);
    if (params.verification_status) q.append('verification_status', params.verification_status);
    return this.makeRequest(`/admin/user-verification-management.php?${q.toString()}`);
  }

  /**
   * Admin: update user verification status
   */
  async updateUserVerificationStatus(userId: number, updateData: {
    user_status?: string;
    is_verified?: boolean;
    verification_status?: string;
    verified_by?: number;
    seller_status?: string;
    rejection_reason?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest('/admin/user-verification-management.php', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, ...updateData })
    });
  }

  /**
   * Admin: fetch overview/dashboard metrics
   */
  async getAdminOverview(): Promise<ApiResponse<any>> {
    return this.makeRequest('/admin/overview.php');
  }

  /**
   * Auction Creation Methods
   */

  async createAuction(auctionData: {
    itemType: 'vehicle' | 'electronic';
    title: string;
    description: string;
    startingPrice: number;
    reservePrice?: number;
    hasReservePrice: boolean;
    auctionStartDate: string;
    auctionStartTime: string;
    auctionEndDate: string;
    auctionEndTime: string;
    // Vehicle specific
  vehicleCategory?: string;
  vehicleType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    vehicleMileage?: string;
    vehicleCondition?: string;
    // Electronics specific
    electronicsBrand?: string;
    electronicsModel?: string;
    electronicsYear?: string;
    electronicsCondition?: string;
    // Images
    images?: Array<{ url: string; alt_text?: string }>;
    // Allow caller to set status: 'draft' (default) or 'pending'|'pending_review' (submit for review)
    status?: 'draft' | 'pending' | 'pending_review';
  }): Promise<ApiResponse<{
    auction_id: number;
    item_type: string;
    title: string;
    status: string;
    start_time: string;
    end_time: string;
    starting_price: number;
    reserve_price?: number;
  }>> {
    // Ensure status is sent (backend defaults to draft)
    return this.makeRequest('/auctions/create.php', {
      method: 'POST',
      body: JSON.stringify(auctionData)
    });
  }

  /**
   * Seller Auction Methods
   */

  async getSellerAuctions(params: {
    sellerId: number;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    auctions: Auction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams({
      seller_id: params.sellerId.toString(),
      status: params.status || 'all',
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString()
    });

  // seller-auctions endpoint lives under /auctions on the API server
  return this.makeRequest(`/auctions/seller-auctions.php?${queryParams.toString()}`);
  }

  async updateAuction(auctionId: number, data: any): Promise<ApiResponse> {
    return this.makeRequest('/auctions/update.php', {
      method: 'PUT',
      body: JSON.stringify({ auction_id: auctionId, ...data })
    });
  }

  /**
   * Get detailed auction information including images
   */
  async getAuctionDetails(auctionId: number): Promise<ApiResponse> {
    return this.makeRequest(`/auction-details.php?id=${auctionId}`);
  }

  /**
   * Get seller's sales data
   */
  async getSellerSales(sellerId: number, page: number = 1, limit: number = 10): Promise<ApiResponse> {
    return this.makeRequest(`/seller_sales.php?seller_id=${sellerId}&page=${page}&limit=${limit}`);
  }

  /**
   * Payout Methods Management
   */

  async getPayoutMethods(): Promise<ApiResponse<Array<{
    id: number;
    method_type: 'bank_transfer' | 'mpesa' | 'paypal';
    bank_name?: string;
    account_number_masked?: string;
    account_name?: string;
    branch_code?: string;
    phone_number_masked?: string;
    paypal_email?: string;
    is_default: boolean;
    is_verified: boolean;
    status: string;
    created_at: string;
    updated_at: string;
  }>>> {
    return this.makeRequest('/payout-methods.php');
  }

  async createPayoutMethod(data: {
    method_type: 'bank_transfer' | 'mpesa' | 'paypal';
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    branch_code?: string;
    phone_number?: string;
    paypal_email?: string;
    is_default?: boolean;
  }): Promise<ApiResponse<{ id: number }>> {
    return this.makeRequest('/payout-methods.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePayoutMethod(id: number, data: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    branch_code?: string;
    phone_number?: string;
    paypal_email?: string;
  }): Promise<ApiResponse> {
    return this.makeRequest(`/payout-methods.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async setDefaultPayoutMethod(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/payout-methods.php?id=${id}&action=set_default`, {
      method: 'PUT'
    });
  }

  async deletePayoutMethod(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/payout-methods.php?id=${id}`, {
      method: 'DELETE'
    });
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, User, RegisterData, Auction, Category };
