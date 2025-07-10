interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
        throw error;
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Méthodes CRUD génériques
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      return await this.request<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      return await this.request<T>(endpoint, { method: 'DELETE' });
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Méthodes spécifiques pour l'application
  async getChantiers() {
    return this.get('/chantiers');
  }

  async createChantier(chantier: any) {
    return this.post('/chantiers', chantier);
  }

  async updateChantier(id: string, chantier: any) {
    return this.put(`/chantiers/${id}`, chantier);
  }

  async deleteChantier(id: string) {
    return this.delete(`/chantiers/${id}`);
  }

  async getOuvriers() {
    return this.get('/ouvriers');
  }

  async createOuvrier(ouvrier: any) {
    return this.post('/ouvriers', ouvrier);
  }

  async updateOuvrier(id: string, ouvrier: any) {
    return this.put(`/ouvriers/${id}`, ouvrier);
  }

  async deleteOuvrier(id: string) {
    return this.delete(`/ouvriers/${id}`);
  }

  async getMateriel() {
    return this.get('/materiel');
  }

  async createMateriel(materiel: any) {
    return this.post('/materiel', materiel);
  }

  async updateMateriel(id: string, materiel: any) {
    return this.put(`/materiel/${id}`, materiel);
  }

  async deleteMateriel(id: string) {
    return this.delete(`/materiel/${id}`);
  }

  async getClients() {
    return this.get('/clients');
  }

  async createClient(client: any) {
    return this.post('/clients', client);
  }

  async updateClient(id: string, client: any) {
    return this.put(`/clients/${id}`, client);
  }

  async deleteClient(id: string) {
    return this.delete(`/clients/${id}`);
  }

  async getFactures() {
    return this.get('/factures');
  }

  async createFacture(facture: any) {
    return this.post('/factures', facture);
  }

  async updateFacture(id: string, facture: any) {
    return this.put(`/factures/${id}`, facture);
  }

  async deleteFacture(id: string) {
    return this.delete(`/factures/${id}`);
  }

  async getSaisiesHeures() {
    return this.get('/saisies-heures');
  }

  async createSaisieHeure(saisie: any) {
    return this.post('/saisies-heures', saisie);
  }

  async updateSaisieHeure(id: string, saisie: any) {
    return this.put(`/saisies-heures/${id}`, saisie);
  }

  async deleteSaisieHeure(id: string) {
    return this.delete(`/saisies-heures/${id}`);
  }

  async getUtilisateurs() {
    return this.get('/utilisateurs');
  }

  async createUtilisateur(utilisateur: any) {
    return this.post('/utilisateurs', utilisateur);
  }

  async updateUtilisateur(id: string, utilisateur: any) {
    return this.put(`/utilisateurs/${id}`, utilisateur);
  }

  async deleteUtilisateur(id: string) {
    return this.delete(`/utilisateurs/${id}`);
  }

  async getPlanningEvents() {
    return this.get('/planning');
  }

  async createPlanningEvent(event: any) {
    return this.post('/planning', event);
  }

  async updatePlanningEvent(id: string, event: any) {
    return this.put(`/planning/${id}`, event);
  }

  async deletePlanningEvent(id: string) {
    return this.delete(`/planning/${id}`);
  }

  // Méthodes pour les rapports
  async generateReport(type: string, params: any) {
    return this.post('/rapports/generate', { type, params });
  }

  async exportData(type: string, format: string, params: any) {
    return this.post('/export', { type, format, params });
  }

  // Méthodes pour la synchronisation
  async syncData() {
    return this.post('/sync', {});
  }

  async getBackups() {
    return this.get('/backups');
  }

  async createBackup() {
    return this.post('/backups', {});
  }

  async restoreBackup(backupId: string) {
    return this.post(`/backups/${backupId}/restore`, {});
  }
}

// Instance singleton
export const apiClient = new ApiClient();

// Hook pour utiliser l'API client dans les composants React
export const useApi = () => {
  return apiClient;
};