import { useState, useEffect } from "react";
import emailjs from '@emailjs/browser';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Send, MessageCircle, Star } from "lucide-react";

// Social media logos (fallback to icons if images not available)
// import facebookLogo from "../../assets/images/icons/facebook-Logo.png";
// import instagramLogo from "../../assets/images/icons/instagram-Logo.png";

export default function ContactPage() {
  
  // State para sa form input
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Para sa bawat pagbabago sa input field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Kapag sinubmit yung form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const serviceID = "service_dq2932e";
    // This template is for the email sent to you (the admin)
    const adminTemplateID = "template_yx6apnf";
    // **ACTION REQUIRED**: Create a new template in EmailJS for the customer
    // and replace 'YOUR_CUSTOMER_TEMPLATE_ID' with its actual ID.
    const customerTemplateID = "template_f7lyis3";

    // Parameters for the email to the admin
    const adminEmailParams = {
      name: formData.name,
      email: formData.email,
      inquiry_subject: formData.subject,
      message: formData.message,
    };

    // Parameters for the acknowledgement email to the customer
    const customerEmailParams = {
      name: formData.name,
      customer_email: formData.email, // Used in your EmailJS template to set the recipient
      subject: formData.subject,
      message: formData.message,
    }
    try {
      // Use Promise.all to send both emails concurrently
      await Promise.all([
        emailjs.send(serviceID, adminTemplateID, adminEmailParams),
        emailjs.send(serviceID, customerTemplateID, customerEmailParams)
      ]);

      setSubmitStatus('success');
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("EmailJS error:", error);
      setSubmitStatus('error');
    }
    setIsSubmitting(false);

    setTimeout(() => setSubmitStatus(null), 3000);
  };

  useEffect(() => {
    // Initialize EmailJS with your User ID (Public Key)
    emailjs.init("YXAWeRbfmChLSofYa");
  }, []);

  return (
    <div className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 pt-24 lg:pt-32 px-6 pb-0 transition-colors duration-300">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-200/20 dark:from-pink-800/10 dark:to-purple-800/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-pink-200/20 dark:from-blue-800/10 dark:to-pink-800/10 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto text-center">
            {/* Header */}
            <div className="mb-16">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full text-sm font-medium">
                  Get In Touch
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="text-gray-900 dark:text-white">Contact </span>
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">Us</span>
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full mb-8" />
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Have questions or special requests? We'd love to hear from you and help bring your vision to life!
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form Section */}
            <div className="relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Send us a Message</h2>
                    <p className="text-gray-600 dark:text-gray-400">We'll get back to you within 24 hours</p>
                  </div>
                </div>

                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center">
                      <Star size={20} className="text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-green-800 dark:text-green-200 font-medium">Thank you! Your message has been sent successfully.</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Your Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 group-hover:border-pink-300 dark:group-hover:border-pink-600"
                        placeholder="Enter your full name"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 group-hover:border-pink-300 dark:group-hover:border-pink-600"
                        placeholder="your.email@example.com"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Subject *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 group-hover:border-pink-300 dark:group-hover:border-pink-600"
                        placeholder="What is your message about?"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Your Message *
                    </label>
                    <div className="relative">
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="6"
                        className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 group-hover:border-pink-300 dark:group-hover:border-pink-600"
                        placeholder="Tell us about your custom order, ask questions, or share your ideas..."
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center justify-center">
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={20} className="mr-2" />
                          Send Message
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-8">
              {/* Contact Details Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <MapPin size={20} className="text-white" />
                    </div>
                    Contact Information
                  </h3>
                  
                  <div className="space-y-6">
                    {[
                      {
                        icon: MapPin,
                        title: "Address",
                        content: "Granville Townhouses, Barangay Lawa, Calamba City, Laguna",
                        color: "from-pink-500 to-rose-500"
                      },
                      {
                        icon: Phone,
                        title: "Phone",
                        content: "+63 123 456 7890",
                        color: "from-blue-500 to-cyan-500"
                      },
                      {
                        icon: Mail,
                        title: "Email",
                        content: "altheascrochet@gmail.com",
                        color: "from-purple-500 to-violet-500"
                      },
                      {
                        icon: Clock,
                        title: "Business Hours",
                        content: "Mon-Sat: 9AM-6PM\nSunday: By appointment",
                        color: "from-green-500 to-emerald-500"
                      }
                    ].map((item, index) => (
                      <div key={index} className="group/item flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300">
                        <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform duration-300`}>
                          <item.icon size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white mb-1">{item.title}</p>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Media Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-pink-500/10 rounded-3xl blur-xl"></div>
                <div className="relative bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                      <Star size={20} className="text-white" />
                    </div>
                    Follow Our Journey
                  </h3>
                  
                  <div className="space-y-4">
                    <a
                      href="https://www.facebook.com/Teyananana"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4 group-hover/social:scale-110 transition-transform duration-300">
                        <Facebook size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">Facebook</span>
                        <p className="text-blue-500 dark:text-blue-300 text-sm">@altheascroshet</p>
                      </div>
                    </a>

                    <a
                      href="https://www.instagram.com/croshet_bloom"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/social flex items-center p-4 bg-gradient-to-r from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20 hover:from-pink-100 hover:to-rose-200 dark:hover:from-pink-900/40 dark:hover:to-rose-800/40 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mr-4 group-hover/social:scale-110 transition-transform duration-300">
                        <Instagram size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-pink-600 dark:text-pink-400 font-semibold text-lg">Instagram</span>
                        <p className="text-pink-500 dark:text-pink-300 text-sm">@altheascroshet</p>
                      </div>
                    </a>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-pink-200/50 dark:border-pink-700/50">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                        <span className="text-white text-sm">💡</span>
                      </div>
                      <div>
                        <p className="text-gray-800 dark:text-white font-semibold mb-2">Stay Connected!</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          Follow us on social media to see our latest creations, get inspiration for your custom orders, and be the first to know about special offers!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
