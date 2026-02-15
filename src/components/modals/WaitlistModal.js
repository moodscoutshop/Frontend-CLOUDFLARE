import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, Mail, Phone, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

/**
 * WaitlistModal - Feedback/Waitlist form modal
 */
export function WaitlistModal({ isOpen, onClose }) {
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
  const [otherMarketplace, setOtherMarketplace] = useState('');
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const marketplaceOptions = [
    "Etsy", "Temu", "Shein", "Amazon", "Target",
    "eBay", "Shopify Stores", "AliExpress", "Walmart", "Other"
  ];
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Update form data when categories change
  useEffect(() => {
    const mappedCategories = selectedCategories.map(cat => {
      if (cat === 'Other' && otherMarketplace.trim()) {
        return `Other: ${otherMarketplace.trim()}`;
      }
      return cat;
    });
    setFormData(prev => ({ ...prev, categories: mappedCategories }));
  }, [selectedCategories, otherMarketplace]);
  
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        if (category === 'Other') setOtherMarketplace('');
        return prev.filter(cat => cat !== category);
      } else {
        if (category === 'Other') setOtherMarketplace('');
        return [...prev, category];
      }
    });
  };
  
  const removeCategory = (categoryToRemove) => {
    setSelectedCategories(prev => {
      if (categoryToRemove === 'Other') setOtherMarketplace('');
      return prev.filter(cat => cat !== categoryToRemove);
    });
  };
  
  const saveToDatabase = async (data) => {
    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) return { success: false, duplicate: true };
        throw new Error(result.message || 'Database error');
      }
      return { success: true, duplicate: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const sendEmail = async (data) => {
    try {
      const serviceID = 'service_bu2wks4';
      const templateID = 'template_27up41k';
      const publicKey = 'RePsWz0YaYvq-ZsRU';
      
      const templateParams = {
        to_name: 'MoodScout Team',
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        reason: data.reason,
        category: Array.isArray(data.categories) ? data.categories.join(', ') : data.categories || 'None',
      };
      
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceID,
          template_id: templateID,
          user_id: publicKey,
          template_params: templateParams,
        }),
      });
      
      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      alert('Please select at least one marketplace');
      return;
    }
    
    if (selectedCategories.includes('Other') && !otherMarketplace.trim()) {
      alert('Please add the marketplace name for "Other".');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const cleanedData = {
        ...formData,
        phone: formData.phone?.trim() || 'N/A',
      };
      
      const dbResult = await saveToDatabase(cleanedData);
      
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
      
      await sendEmail(cleanedData);
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', reason: '', categories: [] });
      setSelectedCategories([]);
      setOtherMarketplace('');
      
      setTimeout(() => {
        onClose();
        setSubmitStatus(null);
      }, 2500);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    onClose();
    setSubmitStatus(null);
    setSelectedCategories([]);
    setOtherMarketplace('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FDFDF8] rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8 border border-[#D4CFC0]">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#5D5F60] hover:text-[#1D1F20] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {submitStatus === 'success' ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-[#EB9D2A]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#EB9D2A]" />
            </div>
            <h3 className="text-xl font-bold text-[#1D1F20] mb-2">Thanks for your feedback! 🎉</h3>
            <p className="text-[#5D5F60]">We'll use it to make MoodScout better.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#EB9D2A]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-[#EB9D2A]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1D1F20] mb-2">Help Improve MoodScout</h3>
              <p className="text-[#5D5F60] text-sm sm:text-base">Your feedback helps us make MoodScout better before launch.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#3D3F40] mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D5F60]" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-[#D4CFC0] rounded-lg focus:ring-2 focus:ring-[#EB9D2A] focus:border-transparent outline-none transition-all bg-white text-[#1D1F20]"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#3D3F40] mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D5F60]" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-[#D4CFC0] rounded-lg focus:ring-2 focus:ring-[#EB9D2A] focus:border-transparent outline-none transition-all bg-white text-[#1D1F20]"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#3D3F40] mb-2">
                  Phone Number <span className="text-[#5D5F60]">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5D5F60]" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-[#D4CFC0] rounded-lg focus:ring-2 focus:ring-[#EB9D2A] focus:border-transparent outline-none transition-all bg-white text-[#1D1F20]"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              {/* Marketplaces */}
              <div>
                <label className="block text-sm font-medium text-[#3D3F40] mb-2">
                  Marketplaces You'd Like to See <span className="text-red-500">*</span>
                  <span className="text-xs text-[#5D5F60] ml-2">(Select multiple)</span>
                </label>
                
                {selectedCategories.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedCategories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-[#EB9D2A]/20 text-[#B17816] px-3 py-1 rounded-full text-sm"
                      >
                        {category}
                        <button type="button" onClick={() => removeCategory(category)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-[#D4CFC0] rounded-lg">
                  {marketplaceOptions.map((category, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-2.5 text-left rounded-lg border transition-all ${
                        selectedCategories.includes(category)
                          ? 'bg-[#EB9D2A]/10 border-[#EB9D2A] text-[#B17816]'
                          : 'bg-white border-[#D4CFC0] text-[#3D3F40] hover:bg-[#EEEFE9]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        {selectedCategories.includes(category) && (
                          <CheckCircle className="w-4 h-4 text-[#EB9D2A]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedCategories.includes('Other') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={otherMarketplace}
                      onChange={(e) => setOtherMarketplace(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D4CFC0] rounded-lg focus:ring-2 focus:ring-[#EB9D2A] outline-none bg-white text-[#1D1F20]"
                      placeholder="Enter marketplace name"
                    />
                  </div>
                )}
              </div>
              
              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-[#3D3F40] mb-2">
                  Feedback / Ideas / Issues <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-[#5D5F60]" />
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows="4"
                    className="w-full pl-10 pr-4 py-2.5 border border-[#D4CFC0] rounded-lg focus:ring-2 focus:ring-[#EB9D2A] outline-none resize-none bg-white text-[#1D1F20]"
                    placeholder="Tell us what you like, what's missing, or what to fix..."
                  />
                </div>
              </div>
              
              {/* Status Messages */}
              {submitStatus === 'error' && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                  <span>⚠️</span>
                  <div><strong>Something went wrong.</strong> Please try again.</div>
                </div>
              )}
              
              {submitStatus === 'duplicate' && (
                <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm flex items-start gap-2">
                  <span>ℹ️</span>
                  <div><strong>This email is already on the waitlist!</strong></div>
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.email || selectedCategories.length === 0 || !formData.reason}
                className="w-full bg-[#EB9D2A] text-[#1D1F20] py-2 rounded-lg font-medium hover:bg-[#CD8407] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Feedback
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <p className="text-xs text-[#5D5F60] text-center mt-4">
              We respect your privacy. Your feedback is used only to improve the product.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default WaitlistModal;
