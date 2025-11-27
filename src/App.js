import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Search, ShoppingBag, Heart, TrendingUp, Zap, X, Mail, User, CheckCircle, Phone, MessageSquare, Tag, ExternalLink, Wrench } from 'lucide-react';
import logo from './assets/logo.svg';

export default function MoodScoutLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    reason: '', 
    categories: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const etsyCategories = [
    "Art & Collectibles",
    "Bags & Purses",
    "Bath & Beauty",
    "Books, Movies & Music",
    "Clothing",
    "Craft Supplies & Tools",
    "Electronics & Accessories",
    "Home & Living",
    "Jewelry",
    "Paper & Party Supplies",
    "Pet Supplies",
    "Shoes",
    "Toys & Games",
    "Weddings",
    "Other"
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      let newCategories;
      
      if (isSelected) {
        newCategories = prev.filter(cat => cat !== category);
      } else {
        newCategories = [...prev, category];
      }
      
      setFormData(prevData => ({
        ...prevData,
        categories: newCategories
      }));
      
      return newCategories;
    });
  };

  const removeCategory = (categoryToRemove) => {
    setSelectedCategories(prev => {
      const newCategories = prev.filter(cat => cat !== categoryToRemove);
      
      setFormData(prevData => ({
        ...prevData,
        categories: newCategories
      }));
      
      return newCategories;
    });
  };

  // DISABLED - Search functionality (under construction)
  const handleSearch = async (e) => {
    e.preventDefault();
    // Disabled until Etsy API is configured
    return;
  };

  const saveToDatabase = async (data) => {
    try {
      console.log('📝 Saving to database...');
      const response = await fetch('http://localhost:5000/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          categories: data.categories || []
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          return { success: false, duplicate: true };
        }
        throw new Error(result.message || 'Database error');
      }

      console.log('✅ Database save successful');
      return { success: true, duplicate: false };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { success: false, error: error.message };
    }
  };

  const sendEmail = async (data) => {
    try {
      console.log('📧 Sending email...');
      
      const serviceID = 'service_bu2wks4';
      const templateID = 'template_27up41k';
      const publicKey = 'RePsWz0YaYvq-ZsRU';

      const templateParams = {
        to_name: 'MoodScout Team',
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        reason: data.reason,
        category: Array.isArray(data.categories) ? data.categories.join(', ') : data.categories || 'None selected',
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceID,
          template_id: templateID,
          user_id: publicKey,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        console.log('✅ Email sent successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Email failed:', errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const dbResult = await saveToDatabase(formData);
      
      if (dbResult.duplicate) {
        setSubmitStatus('duplicate');
        setIsSubmitting(false);
        return;
      }

      if (!dbResult.success) {
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      const emailResult = await sendEmail(formData);
      
      if (!emailResult.success) {
        console.warn('⚠️ Email failed but data was saved to database');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', reason: '', categories: [] });
      setSelectedCategories([]);
      
      setTimeout(() => {
        setShowModal(false);
        setSubmitStatus(null);
      }, 2500);

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "AI-Powered Discovery",
      description: "Advanced vision models analyze your Pinterest boards to understand your style and preferences"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Smart Matching",
      description: "Sophisticated similarity scoring finds Etsy products that perfectly match your aesthetic"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Curated Results",
      description: "Ranked by relevance, discover handmade treasures that align with your vision"
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="MoodScout Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              MoodScout
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Join The Waitlist
            </button>
          </div>
        </div>
      </nav>

      {/* Waitlist Modal - Keep existing code */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => {
                setShowModal(false);
                setSubmitStatus(null);
                setSelectedCategories([]);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">You're on the list! 🎉</h3>
                <p className="text-gray-600">We'll notify you when we launch.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Join the Waitlist</h3>
                  <p className="text-gray-600">Be the first to discover your perfect products</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Categories Interest <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">(Select multiple)</span>
                    </label>
                    
                    {selectedCategories.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {selectedCategories.map((category, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            {category}
                            <button
                              type="button"
                              onClick={() => removeCategory(category)}
                              className="text-purple-600 hover:text-purple-800 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-xl">
                      {etsyCategories.map((category, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`p-3 text-left rounded-lg border transition-all ${
                            selectedCategories.includes(category)
                              ? 'bg-purple-50 border-purple-500 text-purple-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category}</span>
                            {selectedCategories.includes(category) && (
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {selectedCategories.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Please select at least one category</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why do you want to use MoodScout? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows="4"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Tell us what excites you about MoodScout..."
                      />
                    </div>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <strong>Something went wrong.</strong> Please try again.
                      </div>
                    </div>
                  )}

                  {submitStatus === 'duplicate' && (
                    <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-sm flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <div>
                        <strong>This email is already on the waitlist!</strong> We'll notify you when we launch.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || selectedCategories.length === 0 || !formData.reason}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  We respect your privacy. No spam, ever.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section with Search - UNDER CONSTRUCTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-white"></div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-purple-200 rounded-full px-6 py-2 mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Product Discovery</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent"> Pinterest Dreams</span>
              <br />Into Reality
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover perfectly matched Etsy products from your Pinterest boards. 
              Let AI understand your style and find the treasures you'll love.
            </p>

            {/* Google-style Search Bar - UNDER CONSTRUCTION */}
            <div className="max-w-2xl mx-auto mb-8 relative">
              {/* Under Construction Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                  <Wrench className="w-4 h-4" />
                  <span>Coming Soon</span>
                </div>
              </div>

              <form onSubmit={handleSearch} className="relative opacity-60 pointer-events-none">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Etsy products"
                    disabled
                    className="w-full pl-14 pr-14 py-5 text-lg border-2 border-gray-200 rounded-full outline-none transition-all shadow-lg bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    type="submit"
                    disabled
                    className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-3 rounded-full font-medium cursor-not-allowed"
                  >
                    Search Etsy
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 pointer-events-auto"
                  >
                    Join Waitlist
                  </button>
                </div>
              </form>

              {/* Info message */}
              <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Launching in 2026. Join the waitlist to be notified!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and magical</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Share Your Board", desc: "Paste your Pinterest board URL and let us access your inspiration", icon: <Heart /> },
              { step: "02", title: "AI Analysis", desc: "Our vision models extract style, color, and aesthetic patterns", icon: <Zap /> },
              { step: "03", title: "Discover Products", desc: "Get ranked Etsy results matching your exact taste", icon: <TrendingUp /> }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <div className="text-purple-600">
                      {item.icon}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-purple-500 mb-3">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-purple-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need for perfect product discovery</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Find Your Perfect Match?</h2>
              <p className="text-xl mb-8 text-purple-100">Join thousands discovering their dream products every day</p>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
              >
                Join The Waitlist
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="MoodScout Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold">MoodScout</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 MoodScout. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
