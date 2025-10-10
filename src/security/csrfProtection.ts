import React from 'react';
import { v4 as uuidv4 } from 'uuid';

interface CSRFConfig {
  tokenHeader: string;
  tokenCookie: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
}

const DEFAULT_CONFIG: CSRFConfig = {
  tokenHeader: 'X-CSRF-Token',
  tokenCookie: 'csrf-token',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
};

class CSRFProtection {
  public config: CSRFConfig;
  private token: string | null = null;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeToken();
  }

  private initializeToken(): void {
    // Try to get existing token from cookie
    if (typeof document !== 'undefined') {
      const existingToken = this.getTokenFromCookie();
      if (existingToken) {
        this.token = existingToken;
      } else {
        this.generateNewToken();
      }
    }
  }

  private getTokenFromCookie(): string | null {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${this.config.tokenCookie}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  private setTokenCookie(token: string): void {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hour expiry

    document.cookie = `${this.config.tokenCookie}=${encodeURIComponent(token)}; ` +
      `expires=${expires.toUTCString()}; ` +
      `path=/; ` +
      `SameSite=${this.config.sameSite}` +
      (this.config.secure ? '; Secure' : '');
  }

  public generateNewToken(): string {
    this.token = uuidv4();
    this.setTokenCookie(this.token!);
    return this.token!;
  }

  public getToken(): string {
    if (!this.token) {
      this.token = this.generateNewToken();
    }
    return this.token;
  }

  public validateToken(token: string): boolean {
    return token === this.getToken();
  }

  // Middleware for fetch requests
  public enhanceFetch = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const token = this.getToken();
    
    // Only add CSRF token to state-changing requests
    const method = init?.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const headers = new Headers(init?.headers || {});
      headers.set(this.config.tokenHeader, token);
      
      return fetch(input, {
        ...init,
        headers,
        credentials: 'same-origin', // Important for CSRF protection
      });
    }
    
    return fetch(input, init);
  };

  // React hook for CSRF token
  public useCSRFToken = (): string => {
    const [token, setToken] = React.useState(this.getToken());

    React.useEffect(() => {
      // Refresh token periodically
      const interval = setInterval(() => {
        const newToken = this.generateNewToken();
        setToken(newToken);
      }, 3600000); // Refresh every hour

      return () => clearInterval(interval);
    }, []);

    return token;
  };

  // Form integration
  public addTokenToForm(form: HTMLFormElement): void {
    const existingInput = form.querySelector(`input[name="${this.config.tokenCookie}"]`);
    if (existingInput) {
      (existingInput as HTMLInputElement).value = this.getToken();
    } else {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = this.config.tokenCookie;
      input.value = this.getToken();
      form.appendChild(input);
    }
  }
}

// Global instance
export const csrfProtection = new CSRFProtection();

// Axios interceptor for CSRF
export const setupAxiosCSRF = (axios: any): void => {
  axios.interceptors.request.use((config: any) => {
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      config.headers[csrfProtection.config.tokenHeader] = csrfProtection.getToken();
    }
    return config;
  });
};

// React component wrapper for CSRF protection
export const CSRFProtectedForm: React.FC<{
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  [key: string]: any;
}> = ({ children, onSubmit, ...props }) => {
  const token = csrfProtection.useCSRFToken();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('csrf_token', token);
    
    onSubmit(Object.fromEntries(formData));
  };

  return React.createElement('form', { onSubmit: handleSubmit, ...props }, [
    React.createElement('input', { 
      type: 'hidden', 
      name: 'csrf_token', 
      value: token 
    }),
    children
  ]);
};

// Security headers middleware for Express/Next.js
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};