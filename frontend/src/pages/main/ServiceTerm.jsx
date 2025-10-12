// src/pages/legal/ServiceTerms.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Renders the Terms of Service page.
 * This is a static content page displaying the terms and conditions for using the service.
 */
export default function ServiceTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-6 text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-white sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-4 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
      >
        ← Back
      </button>

      <div className="max-w-3xl p-8 mx-auto bg-white rounded-lg shadow dark:bg-gray-800">
        <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">Last updated: Oct 2025</p>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By using Althea’s Cro-Shet website and services, you agree to these Terms
            of Service. If you do not agree, please do not use our Service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">2. Eligibility</h2>
          <p>
            You must be at least 18 years old. By registering, you warrant that you
            meet this requirement.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">3. Account Registration</h2>
          <p>
            Provide accurate information and keep your password confidential. You are
            responsible for all activity on your account.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">4. Ordering &amp; Customization</h2>
          <p>
            You may customize products and preview with AR. All custom orders are
            subject to stock availability.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">5. Pricing &amp; Payment</h2>
          <p>
            Prices are in PHP and include taxes unless stated. We accept GCash via
            a secure third-party gateway.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">6. Shipping &amp; Delivery</h2>
          <p>
            Delivery times vary. Risk passes to you upon delivery—inspect items and report
            issues within 24 hours.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">7. Cancellations &amp; Returns</h2>
          <p>
            Cancel within 1 hour by emailing{' '}
            <a href="mailto:altheascroshet@gmail.com" className="underline">
              support@altheascroshet.com
            </a>
            . Custom items are non-returnable unless defective.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">8. Intellectual Property</h2>
          <p>
            All content and software are owned by Althea’s Cro-Shet or its licensors. No
            reproduction without consent.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">9. User Conduct</h2>
          <p>
            You agree not to violate laws, infringe rights, or interfere with our Service’s
            operation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">
            10. Disclaimers &amp; Limitation of Liability
          </h2>
          <p>
            The Service is provided “as is.” We are not liable for indirect or consequential
            damages.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">11. Indemnification</h2>
          <p>
            You agree to indemnify Althea’s Cro-Shet from any claims arising from your use of
            the Service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">
            12. Governing Law &amp; Dispute Resolution
          </h2>
          <p>
            These Terms are governed by Philippine law. Disputes go to the courts of Laguna,
            Philippines.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">13. Changes to These Terms</h2>
          <p>
            We may update these Terms. Continued use after changes signifies acceptance.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-xl font-semibold">14. Contact Information</h2>
          <p>
            Questions? Email{' '}
            <a href="mailto:altheascroshet@gmail.com" className="underline">
              legal@altheascroshetgmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
