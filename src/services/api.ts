// Production ASP.NET backend base URL
export const API_BASE_URL = 'https://azhar.runasp.net';

// Generic request helper with automatic Bearer Token injection and JSON parsing
async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const token = localStorage.getItem('azhar_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let finalPath = path;
  const isGetOrHead = method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD';

  const options: RequestInit = {
    method: method.toUpperCase(),
    headers,
  };

  if (body !== undefined) {
    if (isGetOrHead && typeof body === 'object') {
      const queryParams = new URLSearchParams();
      for (const key in body) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          const val = body[key];
          if (val !== undefined && val !== null) {
            queryParams.append(key, String(val));
          }
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        finalPath += (finalPath.includes('?') ? '&' : '?') + queryString;
      }
    } else if (!isGetOrHead) {
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${finalPath}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const parsedError = JSON.parse(errorText);
      errorMessage = parsedError.message || parsedError.title || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Interfaces matching the C# backend models
export interface LoginResponse {
  token: string;
  email?: string;
  fullName?: string;
}

export interface TenantModel {
  id?: string;
  fullName: string;
  email: string;
  password?: string;
  phoneNumber: string;
  houseNumber: string;
  contractNumber: string;
  contractEndDate: string;
  isActive?: boolean;
}

export interface MaintenanceModel {
  id: string;
  category: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  adminNotes?: string;
  createdAt?: string;
  cost?: number;
  villaNumber?: string;
  tenantName?: string;
}

export interface BookingModel {
  id: string;
  facilityId?: string;
  facilityName: string;
  tenantName: string;
  email: string;
  villaNumber?: string;
  date: string;
  time: string;
  duration: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  notes?: string;
}

export interface FacilityModel {
  id?: string;
  name: string;
  description: string;
  maxCapacity: number;
  isAvailable: boolean;
}

// Export API service functions
export const api = {
  // Custom Raw Request for Developer Sandbox
  async customRequest(method: string, path: string, body?: any): Promise<any> {
    return request<any>(method, path, body);
  },

  // Account API
  async loginAdmin(credentials: { email: string; password?: string }): Promise<LoginResponse> {
    const data = await request<LoginResponse>('POST', '/api/Account/login', credentials);
    if (data && data.token) {
      localStorage.setItem('azhar_token', data.token);
      localStorage.setItem('azhar_email', credentials.email);
    }
    return data;
  },

  logout() {
    localStorage.removeItem('azhar_token');
    localStorage.removeItem('azhar_email');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('azhar_token');
  },

  // Tenants API
  async getTenants(email?: string): Promise<TenantModel[]> {
    return request<TenantModel[]>('GET', '/api/Tenants', email ? { email } : undefined);
  },

  async createTenant(tenant: TenantModel): Promise<TenantModel> {
    return request<TenantModel>('POST', '/api/Tenants', tenant);
  },

  async getTenantById(id: string): Promise<TenantModel> {
    return request<TenantModel>('GET', `/api/Tenants/${id}`);
  },

  async updateTenant(id: string, tenant: Omit<TenantModel, 'email' | 'password'> & { isActive: boolean }): Promise<TenantModel> {
    return request<TenantModel>('PUT', `/api/Tenants/${id}`, tenant);
  },

  async deleteTenant(id: string, tenantData: TenantModel): Promise<any> {
    return request<any>('DELETE', `/api/Tenants/${id}`, tenantData);
  },

  async toggleActiveTenant(id: string, tenantData: TenantModel): Promise<any> {
    return request<any>('PUT', `/api/Tenants/${id}/toggle-active`, tenantData);
  },

  // Maintenance API
  async getMaintenance(filter?: { category?: string; description?: string }): Promise<MaintenanceModel[]> {
    return request<MaintenanceModel[]>('GET', '/api/Maintenance', filter);
  },

  async updateMaintenanceStatus(id: string, statusData: { status: string; adminNotes: string }): Promise<any> {
    return request<any>('PUT', `/api/Maintenance/${id}/status`, statusData);
  },

  // Facilities API
  async getFacilities(): Promise<FacilityModel[]> {
    return request<FacilityModel[]>('GET', '/api/Facilities');
  },

  async getAllBookings(filter?: { email?: string }): Promise<BookingModel[]> {
    return request<BookingModel[]>('GET', '/api/Facilities/bookings', filter);
  },

  async updateBookingStatus(id: string, statusData: string | { status?: string; email?: string }): Promise<any> {
    const body = typeof statusData === 'string' ? { status: statusData } : statusData;
    return request<any>('PUT', `/api/Facilities/bookings/${id}/status`, body);
  },

  async createFacility(facility: FacilityModel): Promise<FacilityModel> {
    return request<FacilityModel>('POST', '/api/Facilities', facility);
  },

  async deleteFacility(id: string, emailData: { email: string }): Promise<any> {
    return request<any>('DELETE', `/api/Facilities/${id}`, emailData);
  },

  // Dashboard API
  async getDashboardStats(): Promise<any> {
    return request<any>('GET', '/api/Dashboard');
  },

  // Announcements API
  async getAnnouncements(): Promise<any[]> {
    return request<any[]>('GET', '/api/Announcements');
  },

  async createAnnouncement(announcement: { title: string; description: string; type: string }): Promise<any> {
    return request<any>('POST', '/api/Announcements', announcement);
  },

  async deleteAnnouncement(id: string): Promise<any> {
    return request<any>('DELETE', `/api/Announcements/${id}`);
  },

  // Complaints API
  async getComplaints(): Promise<any[]> {
    return request<any[]>('GET', '/api/Complaints');
  },

  async replyComplaint(id: string, replyData: { reply: string; status: string }): Promise<any> {
    return request<any>('PUT', `/api/Complaints/${id}/reply`, replyData);
  },

  // Villas API
  async getVillas(): Promise<any[]> {
    return request<any[]>('GET', '/api/Villas');
  },

  async createVilla(villa: any): Promise<any> {
    return request<any>('POST', '/api/Villas', villa);
  },

  async updateVilla(id: string, villa: any): Promise<any> {
    return request<any>('PUT', `/api/Villas/${id}`, villa);
  },

  async deleteVilla(id: string): Promise<any> {
    return request<any>('DELETE', `/api/Villas/${id}`);
  },

  // Payments API
  async getPayments(): Promise<any[]> {
    return request<any[]>('GET', '/api/Payments');
  },

  async createPayment(payment: any): Promise<any> {
    return request<any>('POST', '/api/Payments', payment);
  },

  async updatePaymentStatus(id: string, statusData: { status: string }): Promise<any> {
    return request<any>('PUT', `/api/Payments/${id}/status`, statusData);
  },

  // Reports API
  async getFinancialReport(): Promise<any> {
    return request<any>('GET', '/api/Reports/financial');
  },

  async getMaintenanceReport(): Promise<any> {
    return request<any>('GET', '/api/Reports/maintenance');
  }
};
