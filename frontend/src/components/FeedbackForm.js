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
    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {current > 0 && (
          <span className="text-sm font-bold text-amber-700 px-3 py-1 bg-amber-100 rounded-full">
            {getRatingLabel(current)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
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
              className={`transition-all duration-200 ease-in-out focus:outline-none ${
                isActive ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isActive ? '#FFD700' : 'none'}
                stroke={isActive ? '#FFD700' : '#d1d5db'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-200 drop-shadow-sm"
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-10 text-center animate-scale-in">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You for Your Feedback!
          </h3>
          <p className="text-gray-600 text-lg">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-slide-up relative">
        {/* Header with Close Button */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Share Your Experience</h2>
            <p className="text-blue-100 text-sm">{restaurantName}</p>
          </div>
          
          {/* Close Button - Right Side */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/30 hover:bg-white/50 active:bg-white/60 px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm z-10 shadow-lg"
            aria-label="Close feedback form"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-white text-sm font-medium">Close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Phone Number */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-800">
              Phone Number
              <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData({ ...formData, phone_number: formatted });
                }}
                placeholder="Enter your phone number"
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
              />
              {formData.phone_number && formData.phone_number !== '+91' && !validatePhoneNumber(formData.phone_number) && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-red-500 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please enter a valid Indian mobile number
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Your Experience</h3>
              <p className="text-gray-600">Please rate the following aspects</p>
            </div>
          </div>

          {/* Star Ratings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating
              rating={formData.food_quality}
              setRating={(val) => setFormData({ ...formData, food_quality: val })}
              label="Food Quality"
              icon="🍽️"
            />

            <StarRating
              rating={formData.service}
              setRating={(val) => setFormData({ ...formData, service: val })}
              label="Service"
              icon="🤝"
            />

            <StarRating
              rating={formData.ambiance}
              setRating={(val) => setFormData({ ...formData, ambiance: val })}
              label="Ambiance"
              icon="🌟"
            />

            <StarRating
              rating={formData.pricing}
              setRating={(val) => setFormData({ ...formData, pricing: val })}
              label="Pricing / Value for Money"
              icon="💰"
            />
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-lg font-semibold text-gray-800">
                Additional Comments / Suggestions
                <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </label>
              <span className={`text-sm font-medium ${formData.comments.length > 150 ? 'text-red-500' : 'text-gray-500'}`}>
                {formData.comments.length} / 150
              </span>
            </div>
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
              rows="4"
              maxLength={150}
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all text-gray-900 placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white ${
                commentsError ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
            />
            {commentsError && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {commentsError}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl active:scale-[0.98]'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </span>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
