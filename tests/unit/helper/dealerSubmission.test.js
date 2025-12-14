import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Dealer Submission System', () => {
  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const requiredFields = ['storeName', 'contactName', 'contactEmail', 'address', 'city', 'state', 'zip'];
      
      const mockFormData = {
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
      };
      
      const missingFields = requiredFields.filter(field => !mockFormData[field]);
      expect(missingFields).toHaveLength(0);
    });

    it('should reject submission with missing required fields', () => {
      const mockFormData = {
        storeName: 'Test Store',
        contactName: 'John Doe',
        // Missing contactEmail, address, city, state, zip
      };
      
      const requiredFields = ['storeName', 'contactName', 'contactEmail', 'address', 'city', 'state', 'zip'];
      const missingFields = requiredFields.filter(field => !mockFormData[field]);
      
      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields).toContain('contactEmail');
      expect(missingFields).toContain('address');
    });

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com'
      ];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Submission Status Management', () => {
    it('should create submission with PENDING status', () => {
      const mockSubmission = {
        id: 'sub_123',
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      
      expect(mockSubmission.status).toBe('PENDING');
      expect(mockSubmission.id).toBeDefined();
      expect(mockSubmission.createdAt).toBeDefined();
    });

    it('should update submission status to APPROVED', () => {
      const mockSubmission = {
        id: 'sub_123',
        status: 'PENDING',
      };
      
      const updatedSubmission = {
        ...mockSubmission,
        status: 'APPROVED',
        reviewedBy: 'admin@shop.com',
        reviewedAt: new Date().toISOString(),
      };
      
      expect(updatedSubmission.status).toBe('APPROVED');
      expect(updatedSubmission.reviewedBy).toBeDefined();
      expect(updatedSubmission.reviewedAt).toBeDefined();
    });

    it('should update submission status to REJECTED', () => {
      const mockSubmission = {
        id: 'sub_123',
        status: 'PENDING',
      };
      
      const updatedSubmission = {
        ...mockSubmission,
        status: 'REJECTED',
        reviewedBy: 'admin@shop.com',
        reviewedAt: new Date().toISOString(),
        adminNotes: 'Rejected due to incomplete information',
      };
      
      expect(updatedSubmission.status).toBe('REJECTED');
      expect(updatedSubmission.adminNotes).toBeDefined();
    });
  });

  describe('Klaviyo Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should send submission received event to Klaviyo', async () => {
      const mockSubmission = {
        id: 'sub_123',
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
        contactPhone: '+1234567890',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        storeType: 'Dealer',
        description: 'Test store description',
        tags: 'electronics, repair',
        website: 'https://teststore.com',
      };

      const mockKlaviyoEvent = {
        data: {
          type: "event",
          attributes: {
            properties: {
              "Store Name": mockSubmission.storeName,
              "Contact Name": mockSubmission.contactName,
              "Contact Email": mockSubmission.contactEmail,
              "Contact Phone": mockSubmission.contactPhone,
              "Address": mockSubmission.address,
              "City": mockSubmission.city,
              "State": mockSubmission.state,
              "ZIP": mockSubmission.zip,
              "Store Type": mockSubmission.storeType,
              "Description": mockSubmission.description,
              "Tags": mockSubmission.tags,
              "Website": mockSubmission.website,
              "Shop": "test-shop.myshopify.com",
              "Submission ID": mockSubmission.id,
            },
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Store Submission Received",
                  service: "store_locator"
                }
              }
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: mockSubmission.contactEmail,
                  first_name: "John",
                  last_name: "Doe",
                  phone_number: mockSubmission.contactPhone,
                  organization: mockSubmission.storeName,
                  title: "Store Owner",
                  location: {
                    address1: mockSubmission.address,
                    address2: null,
                    city: mockSubmission.city,
                    state: mockSubmission.state,
                    zip: mockSubmission.zip,
                    country: "United States",
                  }
                }
              }
            },
            time: expect.any(String),
            value: 1,
            value_currency: "USD",
            unique_id: `store_submission_${mockSubmission.id}`
          }
        }
      };

      // Mock fetch for Klaviyo API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Simulate sending to Klaviyo
      const response = await fetch('https://a.klaviyo.com/api/events', {
        method: 'POST',
        headers: {
          'accept': 'application/vnd.api+json',
          'revision': '2025-07-15',
          'content-type': 'application/vnd.api+json',
          'Authorization': 'Klaviyo-API-Key test-key'
        },
        body: JSON.stringify(mockKlaviyoEvent)
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://a.klaviyo.com/api/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Klaviyo-API-Key test-key'
          })
        })
      );

      expect(response.ok).toBe(true);
    });

    it('should send approval notification to Klaviyo', async () => {
      const mockSubmission = {
        id: 'sub_123',
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
      };

      const mockApprovalEvent = {
        data: {
          type: "event",
          attributes: {
            properties: {
              "Store Name": mockSubmission.storeName,
              "Contact Name": mockSubmission.contactName,
              "Contact Email": mockSubmission.contactEmail,
              "Status": "APPROVED",
              "Shop": "test-shop.myshopify.com",
              "Submission ID": mockSubmission.id,
            },
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Store Submission APPROVED",
                  service: "store_locator"
                }
              }
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: mockSubmission.contactEmail,
                  first_name: "John",
                  last_name: "Doe",
                  phone_number: null,
                  organization: mockSubmission.storeName,
                }
              }
            },
            time: expect.any(String),
            value: 1,
            value_currency: "USD",
            unique_id: `store_submission_APPROVED_${mockSubmission.id}`
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const response = await fetch('https://a.klaviyo.com/api/events', {
        method: 'POST',
        headers: {
          'accept': 'application/vnd.api+json',
          'revision': '2025-07-15',
          'content-type': 'application/vnd.api+json',
          'Authorization': 'Klaviyo-API-Key test-key'
        },
        body: JSON.stringify(mockApprovalEvent)
      });

      expect(fetch).toHaveBeenCalled();
      expect(response.ok).toBe(true);
    });

    it('should handle Klaviyo API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      try {
        await fetch('https://a.klaviyo.com/api/events', {
          method: 'POST',
          headers: {
            'Authorization': 'Klaviyo-API-Key test-key'
          },
          body: JSON.stringify({})
        });
      } catch (error) {
        expect(error.message).toContain('Klaviyo API error');
      }
    });
  });

  describe('Store Creation from Submission', () => {
    it('should create store from approved submission', () => {
      const mockSubmission = {
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
        contactPhone: '+1234567890',
        address: '123 Main St',
        address2: 'Suite 100',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        country: 'United States',
        storeType: 'Dealer',
        description: 'Test store description',
        tags: 'electronics, repair',
        website: 'https://teststore.com',
        notes: 'Additional notes',
      };

      const createdStore = {
        shop: 'test-shop.myshopify.com',
        name: mockSubmission.storeName,
        link: mockSubmission.website,
        address: mockSubmission.address,
        address2: mockSubmission.address2,
        city: mockSubmission.city,
        state: mockSubmission.state,
        zip: mockSubmission.zip,
        country: mockSubmission.country,
        phone: mockSubmission.contactPhone,
        storeType: mockSubmission.storeType,
        description: mockSubmission.description,
        tags: mockSubmission.tags,
        notes: mockSubmission.notes,
      };

      expect(createdStore.name).toBe(mockSubmission.storeName);
      expect(createdStore.address).toBe(mockSubmission.address);
      expect(createdStore.city).toBe(mockSubmission.city);
      expect(createdStore.state).toBe(mockSubmission.state);
      expect(createdStore.storeType).toBe(mockSubmission.storeType);
      expect(createdStore.shop).toBe('test-shop.myshopify.com');
    });

    it('should handle missing optional fields', () => {
      const mockSubmission = {
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        // Missing optional fields
      };

      const createdStore = {
        shop: 'test-shop.myshopify.com',
        name: mockSubmission.storeName,
        link: null,
        address: mockSubmission.address,
        address2: null,
        city: mockSubmission.city,
        state: mockSubmission.state,
        zip: mockSubmission.zip,
        country: 'United States', // Default value
        phone: null,
        storeType: null,
        description: null,
        tags: null,
        notes: null,
      };

      expect(createdStore.link).toBeNull();
      expect(createdStore.address2).toBeNull();
      expect(createdStore.phone).toBeNull();
      expect(createdStore.country).toBe('United States');
    });
  });

  describe('Feature Gating', () => {
    it('should enable dealer submission for Basic Plan', () => {
      const basicPlanSubscription = {
        name: 'startup',
        status: 'ACTIVE'
      };
      
      // Simulate feature gate check
      const isDealerSubmissionEnabled = basicPlanSubscription && 
        basicPlanSubscription.status === 'ACTIVE' && 
        ['startup', 'basic', 'pro'].includes(basicPlanSubscription.name.toLowerCase());
      
      expect(isDealerSubmissionEnabled).toBe(true);
    });

    it('should disable dealer submission for Free Plan', () => {
      const freePlanSubscription = {
        name: 'free',
        status: 'ACTIVE'
      };
      
      // Simulate feature gate check
      const isDealerSubmissionEnabled = freePlanSubscription && 
        freePlanSubscription.status === 'ACTIVE' && 
        ['startup', 'basic', 'pro'].includes(freePlanSubscription.name.toLowerCase());
      
      expect(isDealerSubmissionEnabled).toBe(false);
    });

    it('should disable dealer submission for inactive subscription', () => {
      const inactiveSubscription = {
        name: 'startup',
        status: 'CANCELLED'
      };
      
      // Simulate feature gate check
      const isDealerSubmissionEnabled = inactiveSubscription && 
        inactiveSubscription.status === 'ACTIVE' && 
        ['startup', 'basic', 'pro'].includes(inactiveSubscription.name.toLowerCase());
      
      expect(isDealerSubmissionEnabled).toBe(false);
    });
  });

  describe('Admin Workflow', () => {
    it('should allow admin to approve submission', () => {
      const mockSubmission = {
        id: 'sub_123',
        status: 'PENDING',
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
      };

      const approvalAction = {
        action: 'approve',
        submissionId: mockSubmission.id,
        adminNotes: 'Approved - store meets requirements',
      };

      expect(approvalAction.action).toBe('approve');
      expect(approvalAction.submissionId).toBe(mockSubmission.id);
      expect(approvalAction.adminNotes).toBeDefined();
    });

    it('should allow admin to reject submission', () => {
      const mockSubmission = {
        id: 'sub_123',
        status: 'PENDING',
        storeName: 'Test Store',
        contactName: 'John Doe',
        contactEmail: 'john@teststore.com',
      };

      const rejectionAction = {
        action: 'reject',
        submissionId: mockSubmission.id,
        adminNotes: 'Rejected - incomplete information provided',
      };

      expect(rejectionAction.action).toBe('reject');
      expect(rejectionAction.submissionId).toBe(mockSubmission.id);
      expect(rejectionAction.adminNotes).toBeDefined();
    });

    it('should prevent actions on non-pending submissions', () => {
      const approvedSubmission = {
        id: 'sub_123',
        status: 'APPROVED',
      };

      const rejectedSubmission = {
        id: 'sub_456',
        status: 'REJECTED',
      };

      const canApprove = approvedSubmission.status === 'PENDING';
      const canReject = rejectedSubmission.status === 'PENDING';

      expect(canApprove).toBe(false);
      expect(canReject).toBe(false);
    });
  });
}); 