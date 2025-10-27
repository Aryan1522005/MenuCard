import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { menuAPI } from '../services/api';
import RestaurantHeader from './RestaurantHeader';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const MenuPage = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState({}); // menu items grouped by category
  const [categoryMeta, setCategoryMeta] = useState({}); // meta returned with menu
  const [categoryList, setCategoryList] = useState([]); // full category list from API
  const [categoryOrder, setCategoryOrder] = useState([]); // category order from menu API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await menuAPI.getMenu(slug);
      
      if (response.success) {
        setRestaurant(response.restaurant);
        setCategories(response.categories);
        setCategoryMeta(response.categoryMeta || {});
        setCategoryOrder(response.categoryOrder || []);
        // After we know the restaurant id, fetch the full category list so we show all
        try {
          const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const res = await fetch(`${baseUrl}/categories?restaurant_id=${response.restaurant.id}`);
          const data = await res.json();
          if (data && data.success) {
            setCategoryList(Array.isArray(data.categories) ? data.categories : []);
          }
        } catch (_) {}
      } else {
        setError(response.message || 'Failed to load menu');
      }
    } catch (err) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!restaurant) {
    return <ErrorMessage message="Restaurant not found" />;
  }

  // Category images mapping (you can customize these)
  const categoryImages = {
    'desserts': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
    'breakfasts': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    'hot meals': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'salads': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
    'starters': 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80',
  };

  const getFilteredItems = () => {
    if (!selectedCategory) return [];
    const items = categories[selectedCategory] || [];
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantHeader restaurant={restaurant} />
      
      <div className="container mx-auto px-4 py-6 max-w-md">
        {!selectedCategory ? (
          /* Category Grid View */
          <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Menu Categories</h2>
            <div className="grid grid-cols-1 gap-4">
              {(categoryOrder.length ? categoryOrder.map(name => ({ name })) : (categoryList.length ? categoryList : Object.keys(categories).map(name => ({ name })))).map((cat) => {
                const categoryName = cat.name || cat;
                const items = categories[categoryName] || [];
                const catMeta = categoryMeta[categoryName] || {};
                const imageUrl = (cat.image_url || catMeta.image_url || categoryImages[categoryName.toLowerCase()] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80');
                return (
                  <button
                    key={categoryName}
                    onClick={() => setSelectedCategory(categoryName)}
                    className="relative cursor-pointer rounded-3xl overflow-hidden mb-5 h-48 shadow-md hover:shadow-xl transition-all"
                  >
                    {/* Background image */}
                    <img src={imageUrl} alt={categoryName} className="absolute inset-0 w-full h-full object-cover z-0" onError={(e)=>{e.currentTarget.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';}} />
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    {/* Centered text */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-white text-2xl uppercase font-semibold drop-shadow-lg" style={{textShadow:'1px 1px 2px rgba(0,0,0,0.5)'}}>{categoryName}</div>
                        <div className="text-white/90 text-sm mt-1 drop-shadow-lg">{items.length} {items.length === 1 ? 'item' : 'items'}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Items List View */
          <div className="space-y-4">
            {/* Back and Title - mobile friendly */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <span className="text-lg">←</span>
                <span className="font-semibold">Back</span>
              </button>
              <h2 className="text-2xl font-extrabold text-gray-900 flex-1 text-right uppercase tracking-wide">{selectedCategory}</h2>
            </div>

            {/* Search Bar */}
            <div className="rounded-full bg-white border border-gray-200 px-4 py-2 shadow-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-gray-700"
              />
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-gray-500">No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by <span className="font-semibold text-blue-600">SmartMenu</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// MenuItem Component - Compact card
const MenuItem = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = item.image_url || '';
  const hasImage = imageUrl && !imageError;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
      <div className="flex gap-4 p-4">
        {/* Image */}
        {hasImage ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
            <span className="text-lg font-bold text-green-600 whitespace-nowrap">₹{parseFloat(item.price).toFixed(2)}</span>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {item.description}
            </p>
          )}

          {!item.is_available && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
