// src/components/layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import { useUser } from "../../context/useUser";

export default function Footer() {
  const { user } = useUser();

  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer
      className={`bg-gray-900 text-gray-300 pt-16 pb-8 mt-20 transition-all duration-300 ease-in-out ${user ? 'lg:ml-[var(--sidebar-width,5rem)]' : ''}`}
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Grid columns */}
        <div className="grid grid-cols-1 gap-12 text-center sm:grid-cols-2 lg:grid-cols-4 sm:text-left">
          {/* Brand + Description + Social */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-white">Althea's Cro-Shet</h2>
            <p className="mb-6 text-sm">
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

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="transition hover:text-white" onClick={handleLinkClick}>
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="transition hover:text-white" onClick={handleLinkClick}>
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-white" onClick={handleLinkClick}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition hover:text-white" onClick={handleLinkClick}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-white">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="transition hover:text-white" onClick={handleLinkClick}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="transition hover:text-white" onClick={handleLinkClick}>
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/service-terms" className="transition hover:text-white" onClick={handleLinkClick}>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-white">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start justify-center sm:justify-start">
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
              <li className="flex items-start justify-center sm:justify-start">
                <Phone className="flex-shrink-0 w-5 h-5 mt-1 mr-3 text-pink-400" />
                <a href="tel:+631234567890" className="transition hover:text-white">
                  +63 9936 006 006
                </a>
              </li>
              <li className="flex items-start justify-center sm:justify-start">
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
        </div>

        {/* Copyright */}
        <div className="pt-8 mt-12 text-sm text-center border-t border-gray-800">
          <p>&copy; {new Date().getFullYear()} Althea's Cro-Shet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
