import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { Award, Leaf, Handshake, MapPin, Clock, Heart } from "lucide-react";

// Images used in the page
import MapImg from "../../assets/images/aboutPage/map.png";
import HomeBg1 from "../../assets/images/homeBg/HomeBg1.png";

// AboutPage component using forwardRef for scroll behavior
const AboutPage = forwardRef(({ noNavbar = false }, ref) => {
  return (
    <div ref={ref} className="bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 w-full transition-colors duration-300">
      {/* Optional Navbar */}
      {!noNavbar && (
        <div className="fixed top-0 w-full z-50">
          <Navbar />
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-200/30 dark:from-pink-800/20 dark:to-purple-800/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 dark:from-blue-800/20 dark:to-pink-800/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full text-sm font-medium">
                Our Story
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                About
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">Althea's Cro-Shet</span>
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full mb-8"></div>
            <p className="text-xl md:text-1xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Where every stitch tells a story and every flower carries a piece of our heart
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Map Section */}
            <div className="group">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl dark:shadow-gray-900/50 transform group-hover:scale-105 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 z-10"></div>
                <img
                  src={MapImg}
                  alt="Location"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8 z-20">
                  <div className="flex items-center text-white mb-2">
                    <MapPin size={20} className="mr-2" />
                    <span className="font-semibold">Our Location</span>
                  </div>
                  <p className="text-white/90 text-lg">
                    Barangay Lawa, Calamba, Laguna
                  </p>
                </div>
              </div>
            </div>

            {/* Story Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                  Our Story
                </h2>
                
                <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  <p className="relative pl-6">
                    <span className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></span>
                    It all started with a single crochet hook and a vision to create something that would last longer than fresh flowers. As a self-taught artist, I discovered the magic of transforming simple yarn into everlasting blooms that could bring smiles for years to come.
                  </p>
                  
                  <p className="relative pl-6">
                    <span className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                    What began as a personal hobby quickly blossomed into Althea's Cro-Shet when friends and family couldn't resist sharing photos of their custom bouquets. The warmth of their encouragement and the joy these creations brought to others inspired me to turn my passion into a purpose.
                  </p>
                  
                  <p className="relative pl-6">
                    <span className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></span>
                    Every flower we create is a labor of love, made with premium yarns and meticulous attention to detail. We believe in slow, intentional crafting - because true beauty can't be rushed. Each piece is designed to be treasured, just like the special moments they're made to celebrate.
                  </p>
                </div>
              </div>

              {/* Mission Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 border border-pink-200/50 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <Heart size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Our Mission</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    To create heirloom-quality crochet flowers that capture the delicate beauty of nature while lasting a lifetime. We're committed to sustainable crafting practices and building meaningful connections through our art, one stitch at a time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                What We Stand For
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gray-900 dark:text-white">Our </span>
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">Values</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: "Artisanal Excellence",
                description: "Each petal is shaped by hand, with stitches so fine they mimic nature's delicate details. We never compromise on quality, from yarn selection to final assembly.",
                color: "from-pink-500 to-rose-500"
              },
              {
                icon: Leaf,
                title: "Mindful Crafting",
                description: "Our commitment to sustainability means choosing materials that are kind to the earth, creating pieces designed to be cherished for generations.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Handshake,
                title: "Personal Touch",
                description: "We believe in the power of personal connection. Whether it's a custom color match or a special request, your vision guides our hands.",
                color: "from-purple-500 to-violet-500"
              }
            ].map((item, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Hover Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Card Content */}
                <div className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800 transform group-hover:-translate-y-2 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon size={28} className="text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        className="relative py-32 px-6 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${HomeBg1})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-12 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-center mb-6">
              <Clock size={32} className="text-pink-600 dark:text-pink-400 mr-3" />
              <span className="text-lg font-semibold text-gray-800 dark:text-white">Join Our Journey</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6">
              Ready to Create Something Beautiful?
            </h3>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              🌸 Thank you for getting to know us — we're excited to grow with you and create something truly special together!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Explore Our Shop
              </button>
              <Link 
                to="/portfolio" 
                className="px-8 py-4 border-2 border-pink-500 dark:border-pink-400 text-pink-600 dark:text-pink-400 hover:bg-pink-500 hover:text-white dark:hover:bg-pink-400 dark:hover:text-gray-900 font-semibold rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 text-center"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default AboutPage;
