import React, { useState } from 'react';
import api from '../services/api';


const StarRating = ({ rating, setRating, label, required = true, icon = null }) => {
  const [hover, setHover] = useState(0);

  const getRatingLabel = (value) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[value] || '';
  };

  const current = hover || rating;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-indigo-300">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          {icon && <span className="inline-flex items-center">{icon}</span>}
          <span className="text-sm">{label}</span> {required && <span className="text-red-500 text-xs">*</span>}
        </label>
        {current > 0 && (
          <span className="text-xs font-bold text-amber-700 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-200">
            {getRatingLabel(current)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= current;
          return (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded p-0.5"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill={isActive ? '#F59E0B' : 'none'}
                stroke={isActive ? '#F59E0B' : '#D1D5DB'}
                strokeWidth={isActive ? '0' : '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-200"
                style={{ width: '28px', height: '28px', flexShrink: 0 }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FeedbackForm = ({ restaurantId, restaurantName, onClose }) => {
  const [formData, setFormData] = useState({
    phone_number: '+91',
    food_quality: 0,
    service: 0,
    ambiance: 0,
    pricing: 0,
    comments: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [commentsError, setCommentsError] = useState(null);

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    if (!phone || phone === '+91') return true; // Optional field or just +91
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If empty, return +91
    if (!digits) return '+91';
    
    // If starts with 91, format as +91
    if (digits.startsWith('91')) {
      const phoneDigits = digits.substring(2);
      if (phoneDigits.length <= 10) {
        return `+91${phoneDigits}`;
      }
    }
    
    // If starts with 6-9 (Indian mobile number), add +91
    if (digits.length > 0 && /^[6-9]/.test(digits)) {
      if (digits.length <= 10) {
        return `+91${digits}`;
      }
    }
    
    // If starts with 0, remove it and add +91
    if (digits.startsWith('0')) {
      const phoneDigits = digits.substring(1);
      if (phoneDigits.length <= 10) {
        return `+91${phoneDigits}`;
      }
    }
    
    return '+91'; // Default to +91 if doesn't match patterns
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate phone number if provided
    if (formData.phone_number && formData.phone_number !== '+91' && !validatePhoneNumber(formData.phone_number)) {
      setError('Please enter a valid Indian mobile number (+91 followed by 10 digits starting with 6-9)');
      return;
    }

    // Validate all ratings are provided
    if (
      !formData.food_quality ||
      !formData.service ||
      !formData.ambiance ||
      !formData.pricing
    ) {
      setError('Please provide all ratings');
      return;
    }

    // Validate comments length
    if (formData.comments && formData.comments.length > 150) {
      setError('Additional comments cannot exceed 150 characters');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Submitting feedback:', {
        restaurant_id: restaurantId,
        phone_number: formData.phone_number,
        phone_number_sent: formData.phone_number && formData.phone_number !== '+91' ? formData.phone_number : null,
        food_quality: formData.food_quality,
        service: formData.service,
        ambiance: formData.ambiance,
        pricing: formData.pricing,
        comments: formData.comments
      });
      
      // Prepare phone number - send null if empty or just +91, otherwise send the actual number
      const phoneToSend = (formData.phone_number && formData.phone_number.trim() !== '+91' && formData.phone_number.trim() !== '') 
        ? formData.phone_number.trim() 
        : null;
      
      console.log('===== PHONE NUMBER DEBUG =====');
      console.log('Phone number processing:', {
        original: formData.phone_number,
        trimmed: formData.phone_number?.trim(),
        sending: phoneToSend,
        isValid: validatePhoneNumber(formData.phone_number),
        length: formData.phone_number?.length
      });
      console.log('==============================');

      const response = await api.post('/feedback/submit', {
        restaurant_id: restaurantId,
        phone_number: phoneToSend,
        food_quality: formData.food_quality,
        service: formData.service,
        ambiance: formData.ambiance,
        pricing: formData.pricing,
        comments: formData.comments || null
      });

      console.log('Response received:', response.data);

      if (response.data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose && onClose();
        }, 2500);
      } else {
        setError(response.data.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Unable to connect to server. Please check if the backend is running.');
      } else if (err.response?.status === 404) {
        setError('Feedback endpoint not found. Please check the API configuration.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to submit feedback');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-12 text-center relative overflow-hidden">
          {/* Success Animation Background */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 opacity-50"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You! 🙏
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Your feedback has been submitted successfully. We truly appreciate your time and valuable input!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-10"></div>
        <div className="absolute top-20 right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl opacity-20"></div>
        
        {/* Header with Close Button */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-8 py-8 rounded-t-3xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-2">
              <svg className="text-yellow-300" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px' }}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Share Your Experience</h2>
            <p className="text-white/90 text-base font-medium">{restaurantName}</p>
          </div>
          
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 active:bg-white/40 px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm shadow-lg"
            aria-label="Close feedback form"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-white text-sm font-semibold">Close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-8 space-y-6 bg-white">

          {/* Privacy Note First */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="text-blue-600" fill="currentColor" viewBox="0 0 20 20" style={{ width: '18px', height: '18px', color: '#2563eb' }}>
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 leading-relaxed">
                  <strong style={{ color: '#1e40af' }}>Your Privacy Matters:</strong> Your phone number is completely confidential and will never be shared with the restaurant or any third parties. It's only used for internal analytics and is securely hashed in all reports.
                </p>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-3 ml-3">
            <label className="block text-base font-semibold text-gray-900">
              Phone Number
              <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
            </label>
            <div className="relative max-w-md">
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, phone_number: formatted });
                }}
                placeholder="Enter your 10-digit mobile number"
                className="w-full px-4 py-4 text-base border-0 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white"
              />
              {formData.phone_number && formData.phone_number !== '+91' && !validatePhoneNumber(formData.phone_number) && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-2 text-red-600 text-sm font-medium mt-1">
                  <svg fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px' }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please enter a valid Indian mobile number
                </div>
              )}
            </div>
          </div>

          {/* Star Ratings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StarRating
              rating={formData.food_quality}
              setRating={(val) => setFormData({ ...formData, food_quality: val })}
              label="Food Quality"
              icon={<svg className="" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px', color: '#f97316' }}><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>}
            />

            <StarRating
              rating={formData.service}
              setRating={(val) => setFormData({ ...formData, service: val })}
              label="Service"
              icon={<svg className="" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px', color: '#3b82f6' }}><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>}
            />

            <StarRating
              rating={formData.ambiance}
              setRating={(val) => setFormData({ ...formData, ambiance: val })}
              label="Ambiance"
              icon={<svg className="" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px', color: '#a855f7' }}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>}
            />

            <StarRating
              rating={formData.pricing}
              setRating={(val) => setFormData({ ...formData, pricing: val })}
              label="Pricing / Value for Money"
              icon={<svg className="" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px', color: '#22c55e' }}><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.114 1.549c.562.649 1.413 1.076 2.187 1.276V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.114-1.549c-.562-.649-1.413-1.076-2.187-1.276V5z" clipRule="evenodd"/></svg>}
            />
          </div>

          {/* Comments */}
          <div className="space-y-3 ml-3">
            <div className="flex items-center justify-between max-w-md">
              <label className="block text-base font-semibold text-gray-900">
                Additional Comments / Suggestions
                <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
              </label>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                formData.comments.length > 150 
                  ? 'text-red-600 bg-red-50 border border-red-200' 
                  : formData.comments.length > 120
                  ? 'text-amber-600 bg-amber-50 border border-amber-200'
                  : 'text-gray-600 bg-gray-100 border border-gray-200'
              }`}>
                {formData.comments.length} / 150
              </span>
            </div>
            <div className="max-w-md">
              <textarea
                value={formData.comments}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, comments: value });
                  if (value.length > 150) {
                    setCommentsError('Comments cannot exceed 150 characters');
                  } else {
                    setCommentsError(null);
                  }
                }}
                placeholder="Share your thoughts, suggestions, or any specific feedback... (max 150 characters)"
                rows="5"
                maxLength={150}
                className={`w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none transition-all text-gray-900 placeholder:text-gray-400 bg-white hover:border-gray-400 focus:bg-white shadow-sm ${
                  commentsError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
            </div>
            {commentsError && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <svg className="" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px' }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {commentsError}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-5 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ width: '16px', height: '16px' }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-base">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 ml-3">
            <div className="max-w-md">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-lg font-bold text-base text-white shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transform'
                }`}
                style={!submitting ? { background: 'linear-gradient(to right, #2563eb, #4f46e5, #7c3aed)' } : {}}
              >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin text-white" fill="none" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting Your Feedback...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', color: '#ffffff' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Submit Feedback</span>
                </span>
              )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
