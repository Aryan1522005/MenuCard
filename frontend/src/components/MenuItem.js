import React from 'react';
import VegNonVegIcon from './VegNonVegIcon';

const MenuItem = ({ item }) => {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl = item.image_url || '';

  return (
    <div className="menu-item-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {imageUrl && !imageError ? (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={imageUrl}
            alt={item.name}
            className="responsive-image w-full h-48 object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 flex-1">
            <VegNonVegIcon isVeg={item.is_veg} />
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          </div>
          <span className="price text-lg font-bold text-green-600 ml-2">
            ₹{item.price.toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-gray-600 text-sm leading-relaxed text-left">
            {item.description}
          </p>
        )}
        {!item.is_available && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem;
