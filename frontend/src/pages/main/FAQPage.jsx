import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShoppingBag, Truck, CreditCard, RefreshCw, Mail, Phone, MessageCircle } from 'lucide-react';

const FAQPage = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [search, setSearch] = useState(''); // Add search state

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqCategories = [
    {
      id: 'orders',
      title: 'Orders & Shipping',
      icon: <ShoppingBag className="w-5 h-5 mr-2 text-pink-600" />,
      questions: [
        {
          question: 'How long does shipping take?',
          answer: 'Processing time is 3-5 business days. Shipping typically takes 5-7 business days within the Philippines.'
        },
        {
          question: 'Do you offer international shipping?',
          answer: 'We are currently shipping to certain locations in the Philippines. We do not offer international shipping at this time.'
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order ships, you\'ll receive a tracking number via email. You can use this to track your package on our shipping partner\'s website.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Pricing',
      icon: <CreditCard className="w-5 h-5 mr-2 text-pink-600" />,
      questions: [
        {
          question: 'What payment methods do you accept?',
          answer: 'As of now, we only accept payments through GCash and Cash on Delivery (COD). All transactions are secure and encrypted.'
        },
        {
          question: 'Do you offer payment plans?',
          showInMobile: false,
          answer: 'Unfortunately, No.                 '
        },
        {
          question: 'Are there any hidden fees?',
          answer: 'No hidden fees. The price you see is what you pay. Any applicable taxes and shipping costs will be clearly displayed before you complete your purchase.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Exchanges',
      icon: <RefreshCw className="w-5 h-5 mr-2 text-pink-600" />,
      questions: [
        {
          question: 'What is your return policy?',
          answer: 'We accept returns within 14 days of delivery. Items must be unused, in original condition, and in their original packaging. Custom or personalized items are final sale.'
        },
        {
          question: 'How do I initiate a return?',
          answer: 'Please contact our customer service team with your order number and reason for return. We\'ll provide you with a return authorization and instructions.'
        },
        {
          question: 'How long do refunds take?',
          answer: 'Once we receive your return, please allow 3-5 business days for processing. Refunds will be credited to your original payment method and may take additional time to appear on your statement.'
        }
      ]
    },
    {
      id: 'products',
      title: 'Products & Care',
      icon: <HelpCircle className="w-5 h-5 mr-2 text-pink-600" />,
      questions: [
        {
          question: 'How do I care for my crochet items?',
          answer: 'Hand wash in cold water with mild detergent. Lay flat to dry. Avoid wringing or twisting. Keep away from direct heat and sunlight when drying or storing.'
        },
        {
          question: 'Are your products handmade?',
          answer: 'Yes! Each item is lovingly handcrafted with care. Small variations in stitching and color are part of the handmade charm and make each piece unique.'
        },
        {
          question: 'Do you accept custom orders?',
          answer: 'Absolutely! We love creating custom pieces. Please contact us with your ideas, and we\'ll work with you to bring your vision to life. Custom orders may require additional time.'
        }
      ]
    }
  ];

  // Filtered categories based on search
  const filteredCategories = faqCategories
    .map((category) => {
      const filteredQuestions = category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(search.toLowerCase()) ||
          q.answer.toLowerCase().includes(search.toLowerCase())
      );
      return filteredQuestions.length
        ? { ...category, questions: filteredQuestions }
        : null;
    })
    .filter(Boolean);

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6 text-pink-600" />,
      title: 'Email Us',
      description: 'We usually respond within 24 hours',
      contact: 'altheacrochet@gmail.com',
      link: 'https://mail.google.com/mail/?view=cm&fs=1&to=altheacrochet@gmail.com'
    },
    {
      icon: <Phone className="w-6 h-6 text-pink-600" />,
      title: 'Call Us',
      description: 'Mon-Fri, 9am-5pm PHT',
      contact: '+63 9936 006 006',
      link: 'tel:+631234567890'
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-pink-600" />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Click to start chat',
      link: '#chat'
    }
  ];

  return (
    <div className="relative z-10 min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 lg:ml-[var(--sidebar-width,5rem)] transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Find answers to common questions about our products, ordering process, shipping, and more.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)} // Add onChange
              className="w-full px-6 py-4 pl-12 text-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
              No questions found.
            </div>
          ) : (
            filteredCategories.map((category, categoryIndex) => (
              <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  {category.icon}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category.title}</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {category.questions.map((item, index) => {
                    // Calculate the global question index for accordion
                    const questionIndex = faqCategories
                      .slice(0, faqCategories.findIndex(cat => cat.id === category.id))
                      .reduce((acc, cat) => acc + cat.questions.length, 0) + index;

                    return (
                      <div key={index} className="p-6">
                        <button
                          className="flex justify-between items-center w-full text-left"
                          onClick={() => toggleAccordion(questionIndex)}
                        >
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {item.question}
                          </h3>
                          {activeIndex === questionIndex ? (
                            <ChevronUp className="w-5 h-5 text-pink-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-pink-600" />
                          )}
                        </button>
                        <div
                          className={`mt-2 text-gray-600 dark:text-gray-300 overflow-hidden transition-all duration-300 ${
                            activeIndex === questionIndex ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <p className="pt-2">{item.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Still have questions?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our customer support team is here to help you with any questions or concerns.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.link}
                target={method.link.startsWith('http') ? '_blank' : undefined}
                rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center hover:bg-pink-50 dark:hover:bg-gray-600 transition-colors duration-300"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full group-hover:bg-pink-200 dark:group-hover:bg-pink-800/50 transition-colors duration-300">
                    {method.icon}
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {method.description}
                </p>
                <p className="text-pink-600 dark:text-pink-400 font-medium">
                  {method.contact}
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-pink-100">
            Browse our collection of handcrafted crochet items and find your perfect piece today.
          </p>
          <a
            href="/shop"
            className="inline-block bg-white text-pink-600 hover:bg-gray-100 font-medium px-8 py-3 rounded-lg shadow-md transition-colors duration-300"
          >
            Shop Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
