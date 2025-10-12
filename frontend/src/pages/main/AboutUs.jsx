import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { Award, Leaf, Handshake, MapPin, Clock, Heart } from "lucide-react";
import { useUser } from "../../context/useUser.js";

// Images used in the page
import MapImg from "../../assets/images/aboutPage/map.png";
import HomeBg1 from "../../assets/images/homeBg/HomeBg1.png";

/**
 * Renders the "About Us" page, which tells the story and mission of Althea's Cro-shet.
 * It uses `forwardRef` to allow a parent component to scroll to it.
 * @param {object} props - The component props.
 * @param {boolean} [props.noNavbar=false] - If true, the Navbar will not be rendered.
 * @param {boolean} [props.embedded=false] - If true, adjusts the layout to be embedded within another page.
 * @param {React.Ref} ref - The forwarded ref to the main div element.
 */
const AboutPage = forwardRef(({ noNavbar = false, embedded = false }, ref) => {
  const { user } = useUser();
  return (
    <div
      ref={ref}
      className={`relative z-10 bg-gradient-to-b from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 ${
        embedded ? '' : user ? 'lg:ml-[var(--sidebar-width,5rem)]' : ''
      } transition-all duration-300 ease-in-out`}
    >
      {/* Optional Navbar */}
      {!noNavbar && <Navbar />}

      {/* Hero Section */}
      <section className="relative z-0 px-6 pt-32 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 rounded-full w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-200/30 dark:from-pink-800/20 dark:to-purple-800/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 rounded-full w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 dark:from-blue-800/20 dark:to-pink-800/20 blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-20 text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 text-sm font-medium text-pink-600 bg-pink-100 rounded-full dark:bg-pink-900/30 dark:text-pink-400">
                Our Story
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl lg:text-7xl">
              <span className="text-transparent bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text">
                About
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">Althea's Cro-Shet</span>
            </h1>
            <div className="w-32 h-1 mx-auto mb-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
            <p className="max-w-3xl mx-auto text-xl leading-relaxed text-gray-600 md:text-1xl dark:text-gray-300">
              Where every stitch tells a story and every flower carries a piece of our heart
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid items-start grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Map Section */}
            <div className="group">
              <div className="relative overflow-hidden transition-all duration-500 transform shadow-2xl rounded-3xl dark:shadow-gray-900/50 group-hover:scale-105">
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-pink-500/10 to-purple-500/10"></div>
                <img
                  src={MapImg}
                  alt="Location"
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center mb-2 text-white">
                    <MapPin size={20} className="mr-2" />
                    <span className="font-semibold">Our Location</span>
                  </div>
                  <p className="text-lg text-white/90">
                    Barangay Lawa, Calamba, Laguna
                  </p>
                </div>
              </div>
            </div>

            {/* Story Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
                  Our Story
                </h2>
                
                <div className="space-y-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  <p className="relative pl-6">
                    <span className="absolute top-0 left-0 w-1 h-full rounded-full bg-gradient-to-b from-pink-500 to-purple-500"></span>
                    It all started with a single crochet hook and a vision to create something that would last longer than fresh flowers. As a self-taught artist, I discovered the magic of transforming simple yarn into everlasting blooms that could bring smiles for years to come.
                  </p>
                  
                  <p className="relative pl-6">
                    <span className="absolute top-0 left-0 w-1 h-full rounded-full bg-gradient-to-b from-purple-500 to-pink-500"></span>
                    What began as a personal hobby quickly blossomed into Althea's Cro-Shet when friends and family couldn't resist sharing photos of their custom bouquets. The warmth of their encouragement and the joy these creations brought to others inspired me to turn my passion into a purpose.
                  </p>
                  
                  <p className="relative pl-6">
                    <span className="absolute top-0 left-0 w-1 h-full rounded-full bg-gradient-to-b from-pink-500 to-purple-500"></span>
                    Every flower we create is a labor of love, made with premium yarns and meticulous attention to detail. We believe in slow, intentional crafting - because true beauty can't be rushed. Each piece is designed to be treasured, just like the special moments they're made to celebrate.
                  </p>
                </div>
              </div>

              {/* Mission Card */}
              <div className="relative group">
                <div className="absolute inset-0 transition-opacity duration-300 opacity-25 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur group-hover:opacity-40"></div>
                <div className="relative p-8 bg-white border shadow-xl dark:bg-gray-900 rounded-2xl border-pink-200/50 dark:border-gray-700/50">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 mr-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                      <Heart size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Our Mission</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    To create heirloom-quality crochet flowers that capture the delicate beauty of nature while lasting a lifetime. We're committed to sustainable crafting practices and building meaningful connections through our art, one stitch at a time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative z-0 px-6 py-16 bg-gradient-to-br from-gray-50 to-pink-50 md:py-20 dark:from-gray-800 dark:to-gray-900">
        <div className="w-full overflow-x-auto">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center md:mb-16">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-full dark:bg-purple-900/30 dark:text-purple-400">
                  What We Stand For
                </span>
              </div>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
                <span className="text-gray-900 dark:text-white">Our </span>
                <span className="text-transparent bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text">Values</span>
              </h2>
              <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
            </div>

            {/* Value Cards */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
                  className="relative flex group"
                >
                  {/* Hover Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Card Content */}
                  <div className="relative flex flex-col p-6 transition-all duration-300 transform bg-white border border-gray-100 shadow-xl md:p-8 dark:bg-gray-900 rounded-3xl dark:shadow-gray-900/50 dark:border-gray-800 group-hover:-translate-y-2">
                    {/* Icon */}
                    <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon size={24} className="text-white md:size-28" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="mb-3 text-lg font-bold text-gray-800 transition-colors duration-300 md:mb-4 md:text-xl dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">
                      {item.title}
                    </h3>
                    <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section
        className="relative z-0 px-6 py-32 bg-fixed bg-center bg-cover"
        style={{ backgroundImage: `url(${HomeBg1})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="p-12 border shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl border-white/20 dark:border-gray-700/20">
            <div className="flex items-center justify-center mb-6">
              <Clock size={32} className="mr-3 text-pink-600 dark:text-pink-400" />
              <span className="text-lg font-semibold text-gray-800 dark:text-white">Join Our Journey</span>
            </div>
            
            <h3 className="mb-6 text-3xl font-bold text-gray-800 md:text-4xl dark:text-white">
              Ready to Buy Something Beautiful?
            </h3>
            
            <p className="mb-8 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
              🌸 Thank you for getting to know us — we're excited to grow with you and create something truly special together!
            </p>
            
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/shop"
                className="px-8 py-4 font-semibold text-center text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl hover:shadow-xl hover:-translate-y-1"
              >
                Explore Our Shop
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default AboutPage;
