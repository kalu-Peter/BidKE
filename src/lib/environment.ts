/**
 * Environment Configuration Utility
 * Provides runtime environment detection and configuration
 */

interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: 'development' | 'production';
  dbPort: number;
  corsOrigin: string;
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.detectEnvironment();
  }

  private detectEnvironment(): EnvironmentConfig {
    const isDevelopment = 
      import.meta.env.DEV || 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';

    if (isDevelopment) {
      return {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
        environment: 'development',
        dbPort: parseInt(import.meta.env.VITE_DB_PORT || '5054'),
        corsOrigin: window.location.origin
      };
    } else {
      return {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://bidke-php.onrender.com',
        environment: 'production',
        dbPort: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
        corsOrigin: window.location.origin
      };
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public getApiUrl(): string {
    return this.config.apiBaseUrl;
  }

  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  public logEnvironment(): void {
    console.log('Environment Configuration:', {
      ...this.config,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol
    });
  }
}

// Export singleton instance
export const environmentManager = new EnvironmentManager();
export default environmentManager;