// src/components/layout/Footer.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, ChevronDown } from "lucide-react";
import { useUser } from "../../context/useUser";

/**
 * Renders the site-wide footer.
 * It adapts its layout for mobile (accordion) and desktop (grid) and adjusts its margin
 * based on whether a logged-in user's sidebar is present.
 */
export default function Footer() {
  const [openAccordion, setOpenAccordion] = useState(null);
  const { user } = useUser();

  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer
      className={`bg-gray-900 text-gray-300 pt-12 sm:pt-16 pb-8 mt-20 transition-all duration-300 ease-in-out ${
        user ? 'lg:ml-[var(--sidebar-width,5rem)]' : ''
      }`}
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Desktop Grid */}
        <div className="hidden gap-12 text-left sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <BrandInfo />
          <QuickLinks onClick={handleLinkClick} />
          <CustomerService onClick={handleLinkClick} />
          <ContactInfo />
        </div>

        {/* Mobile Accordion */}
        <div className="sm:hidden">
          <div className="text-center">
            <BrandInfo isMobile={true} />
          </div>
          <div className="mt-8 space-y-2 border-t border-b border-gray-800">
            <AccordionItem title="Quick Links" isOpen={openAccordion === 'quick'} onToggle={() => setOpenAccordion(openAccordion === 'quick' ? null : 'quick')}>
              <QuickLinks onClick={handleLinkClick} isMobile={true} />
            </AccordionItem>
            <AccordionItem title="Customer Service" isOpen={openAccordion === 'service'} onToggle={() => setOpenAccordion(openAccordion === 'service' ? null : 'service')}>
              <CustomerService onClick={handleLinkClick} isMobile={true} />
            </AccordionItem>
            <AccordionItem title="Contact Us" isOpen={openAccordion === 'contact'} onToggle={() => setOpenAccordion(openAccordion === 'contact' ? null : 'contact')}>
              <ContactInfo isMobile={true} />
            </AccordionItem>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 mt-8 text-sm text-center border-t border-gray-800 sm:mt-12">
          <p>&copy; {new Date().getFullYear()} Althea's Cro-shet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Displays brand information, including name, tagline, and social media links.
 * @param {object} props - The component props.
 * @param {boolean} [props.isMobile=false] - Adjusts styling for mobile layout.
 */
const BrandInfo = ({ isMobile = false }) => (
  <div className={isMobile ? 'mb-8' : ''}>
    <h2 className="mb-4 text-2xl font-bold text-white">Althea's Cro-shet</h2>
    <p className={`mb-6 text-sm ${isMobile ? 'mx-auto max-w-xs' : ''}`}>
              Handcrafted crochet flowers designed to brighten every corner of your life.
            </p>
            <div className="flex justify-center space-x-4 sm:justify-start">
              <a
                href="https://www.facebook.com/Teyananana"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white transition bg-gray-800 rounded-full hover:bg-pink-500"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.instagram.com/croshet_bloom?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white transition bg-gray-800 rounded-full hover:bg-pink-500"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
);

/**
 * Renders a list of quick navigation links.
 * @param {object} props - The component props.
 * @param {function} props.onClick - The click handler for links.
 * @param {boolean} [props.isMobile=false] - Adjusts styling for mobile layout.
 */
const QuickLinks = ({ onClick, isMobile = false }) => (
  <div>
    {!isMobile && <h3 className="mb-4 text-xl font-semibold text-white">Quick Links</h3>}
    <ul className={`space-y-2 ${isMobile ? 'pt-2 pb-4' : ''}`}>
              <li>
        <Link to="/shop" className="transition hover:text-white" onClick={onClick}>
                  Shop
                </Link>
              </li>
              <li>
        <Link to="/gallery" className="transition hover:text-white" onClick={onClick}>
                  Gallery
                </Link>
              </li>
              <li>
        <Link to="/blog" className="transition hover:text-white" onClick={onClick}>
                  Blog
                </Link>
              </li>
              <li>
        <Link to="/about" className="transition hover:text-white" onClick={onClick}>
                  About Us
                </Link>
              </li>
              <li>
        <Link to="/contact" className="transition hover:text-white" onClick={onClick}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
);

/**
 * Renders a list of customer service-related links.
 * @param {object} props - The component props.
 * @param {function} props.onClick - The click handler for links.
 * @param {boolean} [props.isMobile=false] - Adjusts styling for mobile layout.
 */
const CustomerService = ({ onClick, isMobile = false }) => (
  <div>
    {!isMobile && <h3 className="mb-4 text-xl font-semibold text-white">Customer Service</h3>}
    <ul className={`space-y-2 ${isMobile ? 'pt-2 pb-4' : ''}`}>
              <li>
        <Link to="/faq" className="transition hover:text-white" onClick={onClick}>
                  FAQ
                </Link>
              </li>
              <li>
        <Link to="/service-terms" className="transition hover:text-white" onClick={onClick}>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="transition hover:text-white" onClick={onClick}>
                  Feedback
                </Link>
              </li>
            </ul>
          </div>
);

/**
 * Displays contact information like email, phone, and address.
 * @param {object} props - The component props.
 * @param {boolean} [props.isMobile=false] - Adjusts styling for mobile layout.
 */
const ContactInfo = ({ isMobile = false }) => (
  <div>
    {!isMobile && <h3 className="mb-4 text-xl font-semibold text-white">Contact Us</h3>}
    <ul className={`space-y-3 ${isMobile ? 'pt-2 pb-4' : ''}`}>
      <li className={`flex items-start ${isMobile ? 'justify-center' : 'sm:justify-start'}`}>
        <Mail className="flex-shrink-0 w-5 h-5 mt-1 mr-3 text-pink-400" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=altheacrochet@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  altheacrochet@gmail.com
                </a>
              </li>
      <li className={`flex items-start ${isMobile ? 'justify-center' : 'sm:justify-start'}`}>
        <Phone className="flex-shrink-0 w-5 h-5 mt-1 mr-3 text-pink-400" />
                <a href="tel:+63 9936 006 006" className="transition hover:text-white">
                  +63 9936 006 006
                </a>
              </li>
      <li className={`flex items-start ${isMobile ? 'justify-center' : 'sm:justify-start'}`}>
        <MapPin className="flex-shrink-0 w-5 h-5 mt-1 mr-3 text-pink-400" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Granville%20Townhouses%2C%20Barangay%20Lawa%2C%20Calamba%20City%2C%20Laguna"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  Granville Townhouses, Brgy. Lawa, Calamba, Laguna
                </a>
              </li>
            </ul>
          </div>
);

/**
 * A single accordion item for the mobile footer layout.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the accordion item.
 * @param {boolean} props.isOpen - Whether the accordion item is open.
 * @param {function} props.onToggle - Callback to toggle the accordion's open state.
 * @param {React.ReactNode} props.children - The content to display when open.
 */
const AccordionItem = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-800 last:border-b-0">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-4 text-left text-white"
    >
      <span className="font-semibold">{title}</span>
      <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="pb-2 text-center">
        {children}
      </div>
    )}
  </div>
);
