export class TokenManager {
  private static instance: TokenManager;
  private secureStorage: any;

  private constructor() {
    this.secureStorage = null; //new SecureStorageRepositoryImpl();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getAccessToken(): Promise<string | null> {
    return this.secureStorage.loadAccessToken();
  }

  async getRefreshToken(): Promise<string | null> {
    return this.secureStorage.loadRefreshToken();
  }

  async saveTokens(accessToken: string, refreshToken: string): Promise<boolean> {
    return this.secureStorage.saveTokens(accessToken, refreshToken);
  }

  async clearTokens(): Promise<boolean> {
    await this.secureStorage.clearAllAuthData();
    return true;
  }

  async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
