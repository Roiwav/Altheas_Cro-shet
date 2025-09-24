// src/pages/legal/DataPolicy.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../context/DarkModeContext.jsx';

export default function DataPolicy() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen px-4 sm:px-6 lg:px-8 py-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
      >
        ← Back
      </button>

      <div className={`max-w-3xl mx-auto p-8 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last updated: May 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            Althea’s Cro-Shet (“we”, “our”, “us”) respects your privacy and is
            committed to protecting your personal data. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you visit our website and use our web-based
            customized crochet ordering system with AR features.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li key="account-info">
              <strong>Account Information</strong>: full name, username,
              password, email, contact number, birthdate, delivery address.
            </li>
            <li key="order-data">
              <strong>Order Data</strong>: product selections, custom colour
              choices, order history, status updates.
            </li>
            <li key="ar-qr-data">
              <strong>AR &amp; QR Data</strong>: generated QR code identifiers
              and analytics on AR preview usage.
            </li>
            <li key="technical-data">
              <strong>Technical &amp; Usage Data</strong>: device type,
              browser, IP address, cookies, session logs, crash reports.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
          <p>
            We use your data to manage your account, process orders,
            communicate updates, personalise your experience, and analyse
            site performance.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            4. Disclosure of Your Information
          </h2>
          <p>
            We share personal data only with service providers (hosting,
            payment, analytics) under strict confidentiality, or when required
            by law.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Cookies and Tracking</h2>
          <p>
            Cookies maintain your session, store preferences, and gather
            analytics. Disabling them may break core features.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Data Security</h2>
          <p>
            We implement SSL/TLS, hashed passwords, and other standard
            measures to protect your data, though no system is 100% secure.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7. Data Retention</h2>
          <p>
            We keep your data as long as your account is active and as needed
            to comply with legal obligations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">8. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may access, correct, or delete
            your personal data. Contact us at{' '}
            <a
              href="mailto:privacy@altheascroshet.com"
              className="underline text-blue-600"
            >
              privacy@altheascroshet.com
            </a>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">9. Children’s Privacy</h2>
          <p>
            Our service is not directed to children under 13, and we do not
            knowingly collect information from minors.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this policy; the “Last updated” date will reflect
            changes. Continued use means acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Contact Us</h2>
          <p>
            For privacy inquiries, email{' '}
            <a
              href="mailto:privacy@altheascroshet.com"
              className="underline text-blue-600"
            >
              privacy@altheascroshet.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
