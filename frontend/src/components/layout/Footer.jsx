// src/components/layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import emailIcon from "../../assets/images/icons/email.png";
import phoneIcon from "../../assets/images/icons/contact.png";
import locationIcon from "../../assets/images/icons/location.png";
import fbLogo from "../../assets/images/icons/facebook-logo.png";
import igLogo from "../../assets/images/icons/instagram-logo.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand + Description + Social */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Althea's Cro-Shet</h2>
            <p className="text-sm mb-6">
              Handcrafted crochet flowers designed to brighten every corner of your life.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/Teyananana"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition"
              >
                <img src={fbLogo} alt="Facebook" className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/croshet_bloom?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition"
              >
                <img src={igLogo} alt="Instagram" className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="hover:text-white transition">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="hover:text-white transition">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <img src={emailIcon} alt="Email" className="w-5 h-5 mt-1 mr-3" />
                <span>altheacrochet@gmail.com</span>
              </li>
              <li className="flex items-start">
                <img src={phoneIcon} alt="Phone" className="w-5 h-5 mt-1 mr-3" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start">
                <img src={locationIcon} alt="Location" className="w-5 h-5 mt-1 mr-3" />
                <span>Granville, Brgy. Lawa, Calamba Laguna</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          <p> 2025 Althea's Cro-Shet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
