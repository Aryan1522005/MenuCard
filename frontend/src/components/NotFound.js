import React from 'react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Make sure you scanned the correct QR code.
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact the restaurant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
