import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

class GoHighLevelService {
  private client: AxiosInstance;
  private apiKey: string;
  private locationId: string;
  private webhookSecret: string;

  // Murphy Consulting form IDs (in "Get Estimate" folder)
  private murphyFormIds: string[] = [];

  // E-Systems Management form ID
  private esystemsFormId: string = 'Dencs4XQEHrrOmkLPuCz';

  constructor() {
    this.apiKey = process.env.GHL_API_KEY || '';
    this.locationId = process.env.GHL_LOCATION_ID || '';
    this.webhookSecret = process.env.GHL_WEBHOOK_SECRET || '';

    if (!this.apiKey) {
      console.warn('GHL_API_KEY not set - GoHighLevel integration will not work');
    }

    this.client = axios.create({
      baseURL: 'https://rest.gohighlevel.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Verify webhook signature from GoHighLevel
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('GHL_WEBHOOK_SECRET not set - webhook verification will fail');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying GHL webhook signature:', error);
      return false;
    }
  }

  /**
   * Identify which company the form submission belongs to
   */
  identifyCompany(formId: string): 'murphy' | 'esystems' | null {
    if (formId === this.esystemsFormId) {
      return 'esystems';
    }

    // If we have Murphy form IDs configured, check against them
    // Otherwise, assume any other form is Murphy (since they're in the "Get Estimate" folder)
    if (this.murphyFormIds.length === 0 || this.murphyFormIds.includes(formId)) {
      return 'murphy';
    }

    return null;
  }

  /**
   * Parse form submission data into a normalized format
   */
  parseFormSubmission(rawData: any): any {
    const fields = rawData.fields || rawData.formData || {};
    
    // Extract common fields
    const parsed: any = {
      organization: fields.company || fields.organization || fields.businessName || '',
      website: fields.website || fields.url || '',
      email: fields.email || '',
      phone: fields.phone || fields.phoneNumber || '',
      firstName: fields.firstName || fields.first_name || '',
      lastName: fields.lastName || fields.last_name || '',
      message: fields.message || fields.notes || fields.description || '',
      services: [],
      formId: rawData.formId || rawData.form_id,
      submissionId: rawData.submissionId || rawData.id,
      submittedAt: rawData.submittedAt || rawData.created_at || new Date().toISOString(),
    };

    // Extract service selections (if present)
    const serviceFields = Object.keys(fields).filter(key => 
      key.toLowerCase().includes('service') || 
      key.toLowerCase().includes('interest')
    );

    for (const field of serviceFields) {
      if (fields[field]) {
        if (Array.isArray(fields[field])) {
          parsed.services.push(...fields[field]);
        } else {
          parsed.services.push(fields[field]);
        }
      }
    }

    // Include all raw fields for reference
    parsed.rawFields = fields;

    return parsed;
  }

  /**
   * Register a webhook with GoHighLevel
   */
  async registerWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await this.client.post('/webhooks', {
        locationId: this.locationId,
        url: webhookUrl,
        events: ['FormSubmitted'],
      });

      return response.data;
    } catch (error: any) {
      console.error('Error registering GHL webhook:', error.response?.data || error.message);
      throw new Error(`Failed to register GHL webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get forms in the "Get Estimate" folder for Murphy Consulting
   */
  async getMurphyForms(folderId: string = 'Js6hHNkJvK4oKPSmoclb'): Promise<string[]> {
    try {
      const response = await this.client.get('/forms', {
        params: {
          locationId: this.locationId,
          folderId: folderId,
        },
      });

      const forms = response.data.forms || response.data || [];
      this.murphyFormIds = forms.map((f: any) => f.id);
      
      return this.murphyFormIds;
    } catch (error: any) {
      console.error('Error fetching Murphy forms:', error.response?.data || error.message);
      return [];
    }
  }
}

// Export singleton instance
export default new GoHighLevelService();

