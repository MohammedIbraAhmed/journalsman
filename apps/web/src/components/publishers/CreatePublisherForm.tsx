'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';
import { createPublisherSchema } from '@synfind/shared';
import { z } from 'zod';

type CreatePublisherInput = z.infer<typeof createPublisherSchema>;

interface CreatePublisherFormProps {
  userId: string;
}

export function CreatePublisherForm({ userId }: CreatePublisherFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePublisherInput>>({
    name: '',
    domain: '',
    institutionalDetails: {
      type: 'university',
      country: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      contactInfo: {
        primaryEmail: '',
        phoneNumber: '',
        website: '',
      },
      verification: {
        status: 'pending',
        documents: [],
      },
    },
    billingInfo: {
      planType: 'basic',
      maxJournals: 5,
      pricePerMonth: 29.99,
      billingCycle: 'monthly',
      nextBillingDate: new Date(),
      isActive: true,
    },
    settings: {
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
      },
      features: {
        peerReview: true,
        openAccess: true,
        preprints: false,
        automaticPublishing: false,
        crossrefIntegration: true,
      },
      notifications: {
        emailUpdates: true,
        dashboardAlerts: true,
      },
    },
    adminUsers: [],
  });

  const createPublisherMutation = trpc.publisher.create.useMutation({
    onSuccess: (result: any) => {
      if (result.success && result.data) {
        router.push(`/dashboard/publishers/${result.data.id}`);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = createPublisherSchema.parse(formData);
      await createPublisherMutation.mutateAsync({
        ...validatedData,
        adminUserId: userId,
      });
    } catch (error) {
      console.error('Form validation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const result = { ...prev };
      let current: any = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return result;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Publisher Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Domain *
            </label>
            <input
              type="text"
              id="domain"
              required
              placeholder="university.edu"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.domain || ''}
              onChange={(e) => updateFormData('domain', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Institutional Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Institutional Details</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Institution Type *
            </label>
            <select
              id="type"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.institutionalDetails?.type || 'university'}
              onChange={(e) => updateFormData('institutionalDetails.type', e.target.value)}
            >
              <option value="university">University</option>
              <option value="research_institute">Research Institute</option>
              <option value="commercial">Commercial</option>
              <option value="society">Professional Society</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country *
              </label>
              <input
                type="text"
                id="country"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.institutionalDetails?.country || ''}
                onChange={(e) => updateFormData('institutionalDetails.country', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="primaryEmail" className="block text-sm font-medium text-gray-700">
                Primary Email *
              </label>
              <input
                type="email"
                id="primaryEmail"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.institutionalDetails?.contactInfo?.primaryEmail || ''}
                onChange={(e) => updateFormData('institutionalDetails.contactInfo.primaryEmail', e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  id="street"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.institutionalDetails?.address?.street || ''}
                  onChange={(e) => updateFormData('institutionalDetails.address.street', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.institutionalDetails?.address?.city || ''}
                  onChange={(e) => updateFormData('institutionalDetails.address.city', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.institutionalDetails?.address?.state || ''}
                  onChange={(e) => updateFormData('institutionalDetails.address.state', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="zipCode"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.institutionalDetails?.address?.zipCode || ''}
                  onChange={(e) => updateFormData('institutionalDetails.address.zipCode', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="addressCountry" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  id="addressCountry"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.institutionalDetails?.address?.country || ''}
                  onChange={(e) => updateFormData('institutionalDetails.address.country', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
        <div className="space-y-6">
          <div className="flex items-center">
            <input
              id="peerReview"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.settings?.features?.peerReview || false}
              onChange={(e) => updateFormData('settings.features.peerReview', e.target.checked)}
            />
            <label htmlFor="peerReview" className="ml-2 block text-sm text-gray-900">
              Enable peer review process
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="openAccess"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.settings?.features?.openAccess || false}
              onChange={(e) => updateFormData('settings.features.openAccess', e.target.checked)}
            />
            <label htmlFor="openAccess" className="ml-2 block text-sm text-gray-900">
              Support open access publishing
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="crossrefIntegration"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.settings?.features?.crossrefIntegration || false}
              onChange={(e) => updateFormData('settings.features.crossrefIntegration', e.target.checked)}
            />
            <label htmlFor="crossrefIntegration" className="ml-2 block text-sm text-gray-900">
              Enable Crossref integration for DOIs
            </label>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Publisher'}
        </button>
      </div>

      {createPublisherMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating publisher</h3>
              <div className="mt-2 text-sm text-red-700">
                {createPublisherMutation.error.message || 'Failed to create publisher'}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}