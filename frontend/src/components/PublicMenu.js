import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { menuAPI } from '../services/api';
import RestaurantHeader from './RestaurantHeader';
import RestaurantInfo from './RestaurantInfo';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import VegNonVegIcon from './VegNonVegIcon';
import FeedbackForm from './FeedbackForm';

// A slim, read-only menu page focused purely on viewing by guests
const PublicMenu = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState({});
  const [categoryMeta, setCategoryMeta] = useState({});
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [vegFilter, setVegFilter] = useState('all'); // 'all', 'veg', 'nonveg'
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await menuAPI.getMenu(slug);
      if (res.success) {
        setRestaurant(res.restaurant);
        setCategories(res.categories || {});
        setCategoryMeta(res.categoryMeta || {});
        // Use category order from backend
        setCategoryOrder(res.categoryOrder || []);
      } else {
        setError(res.message || 'Failed to load menu');
      }
    } catch (e) {
      setError(e.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // Search functionality
  const handleSearch = useCallback(async (term) => {
    if (!term || term.trim() === '') {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const res = await menuAPI.searchMenu(slug, term);
      if (res.success) {
        setSearchResults(res);
      } else {
        setError(res.message || 'Search failed');
      }
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [slug]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  const normalizeImageUrl = (url) => {
    if (!url) return '';
    let u = String(url).trim();
    try {
      // Handle Google Images redirect links: https://www.google.com/imgres?...&imgurl=ENCODED_URL
      const parsed = new URL(u);
      if (parsed.host.includes('google.') && parsed.pathname.includes('imgres')) {
        const imgurl = parsed.searchParams.get('imgurl');
        if (imgurl) return decodeURIComponent(imgurl);
      }
      return u;
    } catch {
      return u;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!restaurant) return <ErrorMessage message="Restaurant not found" />;

  const categoryNames = categoryOrder;

  return (
    <div className="min-h-screen" style={{ background:'#f7f7f7' }}>
      <RestaurantHeader restaurant={restaurant} />

      <div className="container mx-auto px-4 py-6" style={{ maxWidth: 420 }}>
        {/* Restaurant Information Section */}
        <RestaurantInfo restaurant={restaurant} />
        
        {!selectedCategory ? (
          <div style={{ padding:'16px' }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#111827', textAlign:'center', marginBottom:16 }}>Menu Categories</h2>
            
            {/* Universal Search Bar */}
            <div style={{ marginBottom:20, position:'relative' }}>
              <div style={{ 
                display:'flex', 
                alignItems:'center', 
                background:'#fff', 
                borderRadius:25, 
                padding:'12px 16px', 
                boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                border:'1px solid #e5e7eb'
              }}>
                <svg style={{ width:20, height:20, color:'#6b7280', marginRight:12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search all menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex:1,
                    border:'none',
                    outline:'none',
                    fontSize:16,
                    color:'#374151',
                    background:'transparent'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    style={{
                      background:'none',
                      border:'none',
                      color:'#6b7280',
                      cursor:'pointer',
                      padding:4,
                      marginLeft:8
                    }}
                  >
                    <svg style={{ width:18, height:18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {isSearching && (
                <div style={{ 
                  position:'absolute', 
                  top:'100%', 
                  left:0, 
                  right:0, 
                  background:'#fff', 
                  borderRadius:12, 
                  padding:12, 
                  marginTop:8, 
                  boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                  textAlign:'center',
                  color:'#6b7280'
                }}>
                  Searching...
                </div>
              )}
            </div>

            {/* Search Results or Categories */}
            {searchResults ? (
              <div>
                <div style={{ 
                  display:'flex', 
                  alignItems:'center', 
                  justifyContent:'space-between', 
                  marginBottom:16 
                }}>
                  <h3 style={{ fontSize:18, fontWeight:600, color:'#111827' }}>
                    Search Results ({searchResults.totalResults} items)
                  </h3>
                  <button
                    onClick={clearSearch}
                    style={{
                      background:'#f3f4f6',
                      border:'none',
                      borderRadius:8,
                      padding:'6px 12px',
                      color:'#374151',
                      cursor:'pointer',
                      fontSize:14
                    }}
                  >
                    Clear Search
                  </button>
                </div>
                
                {Object.keys(searchResults.categories || {}).length === 0 ? (
                  <div style={{ 
                    textAlign:'center', 
                    padding:40, 
                    background:'#fff', 
                    borderRadius:12, 
                    color:'#6b7280' 
                  }}>
                    No items found for "{searchResults.searchTerm}"
                  </div>
                ) : (
                  <div style={{ display:'grid', gap:16 }}>
                    {Object.entries(searchResults.categories || {}).map(([categoryName, items]) => (
                      <div key={categoryName} style={{ 
                        background:'#fff', 
                        borderRadius:12, 
                        padding:16, 
                        boxShadow:'0 2px 8px rgba(0,0,0,0.1)' 
                      }}>
                        <h4 style={{ 
                          fontSize:16, 
                          fontWeight:600, 
                          color:'#111827', 
                          marginBottom:12,
                          textTransform:'uppercase'
                        }}>
                          {categoryName}
                        </h4>
                        <div style={{ display:'grid', gap:8 }}>
                          {items.map((item) => (
                            <div key={item.id} style={{ 
                              display:'flex', 
                              alignItems:'flex-start', 
                              justifyContent:'space-between',
                              padding:'12px 0',
                              borderBottom:'1px solid #f3f4f6',
                              gap:12
                            }}>
                              <div style={{ flex:1, display:'flex', alignItems:'flex-start', gap:8, minWidth:0 }}>
                                <div style={{ paddingTop:2, flexShrink:0 }}>
                                  <VegNonVegIcon isVeg={item.is_veg} />
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:14, fontWeight:500, color:'#111827', marginBottom:2, lineHeight:1.4 }}>
                                    {item.name}
                                  </div>
                                  {item.description && (
                                    <div style={{ fontSize:12, color:'#6b7280', textAlign:'left', lineHeight:1.4 }}>
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize:14, fontWeight:600, color:'#059669', whiteSpace:'nowrap', flexShrink:0 }}>
                                ₹{parseFloat(item.price).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
                {categoryNames.map((categoryName) => {
                  const imageUrl = normalizeImageUrl(categoryMeta[categoryName]?.image_url) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
                  return (
                    <button
                      key={categoryName}
                      onClick={() => setSelectedCategory(categoryName)}
                      style={{ position:'relative', cursor:'pointer', borderRadius:24, overflow:'hidden', height:180, marginBottom:20, boxShadow:'0 10px 20px rgba(0,0,0,.08)', border:'none', width:'100%' }}
                    >
                      <img src={imageUrl} alt={categoryName} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }} />
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', zIndex:10 }} />
                      <div style={{ position:'absolute', inset:0, zIndex:20, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
                        <div style={{ color:'#fff', fontSize:20, fontWeight:700, textTransform:'uppercase', textShadow:'1px 1px 2px rgba(0,0,0,0.5)' }}>{categoryName}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom:8 }}>
              <button onClick={() => { setSelectedCategory(null); setSearchTerm(''); }} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:9999, background:'#374151', color:'#fff', border:'none', marginBottom:8, fontSize:16, fontWeight:600, cursor:'pointer', transition:'all 0.2s ease' }}>
                <span style={{ fontSize:20 }}>←</span>
                <span style={{ fontWeight:600 }}>Back</span>
              </button>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#111827', textTransform:'uppercase', textAlign:'center', margin:0 }}>{selectedCategory}</h2>
            </div>

            {/* Category-specific Search Bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ 
                display:'flex', 
                alignItems:'center', 
                background:'#fff', 
                borderRadius:25, 
                padding:'12px 16px', 
                boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                border:'1px solid #e5e7eb'
              }}>
                <svg style={{ width:20, height:20, color:'#6b7280', marginRight:12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search in ${selectedCategory}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex:1,
                    border:'none',
                    outline:'none',
                    fontSize:16,
                    color:'#374151',
                    background:'transparent'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      background:'none',
                      border:'none',
                      color:'#6b7280',
                      cursor:'pointer',
                      padding:4,
                      marginLeft:8
                    }}
                  >
                    <svg style={{ width:18, height:18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Veg/Non-Veg Filter */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <button
                onClick={() => setVegFilter('all')}
                style={{
                  display:'inline-flex',
                  alignItems:'center',
                  gap:6,
                  padding:'8px 16px',
                  borderRadius:20,
                  border: vegFilter === 'all' ? '2px solid #2563eb' : '2px solid #e5e7eb',
                  background: vegFilter === 'all' ? '#eff6ff' : '#fff',
                  color: vegFilter === 'all' ? '#2563eb' : '#6b7280',
                  fontWeight: vegFilter === 'all' ? 600 : 500,
                  fontSize:14,
                  cursor:'pointer',
                  transition:'all 0.2s'
                }}
              >
                <span>All Items</span>
              </button>
              <button
                onClick={() => setVegFilter('veg')}
                style={{
                  display:'inline-flex',
                  alignItems:'center',
                  gap:6,
                  padding:'8px 16px',
                  borderRadius:20,
                  border: vegFilter === 'veg' ? '2px solid #22c55e' : '2px solid #e5e7eb',
                  background: vegFilter === 'veg' ? '#f0fdf4' : '#fff',
                  color: vegFilter === 'veg' ? '#15803d' : '#6b7280',
                  fontWeight: vegFilter === 'veg' ? 600 : 500,
                  fontSize:14,
                  cursor:'pointer',
                  transition:'all 0.2s'
                }}
              >
                <div style={{ 
                  display:'inline-flex',
                  alignItems:'center',
                  justifyContent:'center',
                  width:'16px',
                  height:'16px',
                  border:'2px solid #22c55e',
                  borderRadius:'2px'
                }}>
                  <div style={{ 
                    width:'6px',
                    height:'6px',
                    backgroundColor:'#22c55e',
                    borderRadius:'50%'
                  }} />
                </div>
                <span>Veg Only</span>
              </button>
              <button
                onClick={() => setVegFilter('nonveg')}
                style={{
                  display:'inline-flex',
                  alignItems:'center',
                  gap:6,
                  padding:'8px 16px',
                  borderRadius:20,
                  border: vegFilter === 'nonveg' ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  background: vegFilter === 'nonveg' ? '#fef2f2' : '#fff',
                  color: vegFilter === 'nonveg' ? '#dc2626' : '#6b7280',
                  fontWeight: vegFilter === 'nonveg' ? 600 : 500,
                  fontSize:14,
                  cursor:'pointer',
                  transition:'all 0.2s'
                }}
              >
                <div style={{ 
                  display:'inline-flex',
                  alignItems:'center',
                  justifyContent:'center',
                  width:'16px',
                  height:'16px',
                  border:'2px solid #ef4444',
                  borderRadius:'2px'
                }}>
                  <div style={{ 
                    width:0,
                    height:0,
                    borderLeft:'3px solid transparent',
                    borderRight:'3px solid transparent',
                    borderBottom:'5px solid #ef4444'
                  }} />
                </div>
                <span>Non-Veg Only</span>
              </button>
            </div>

            <div style={{ display:'grid', gap:12 }}>
              {(() => {
                const items = categories[selectedCategory] || [];
                
                // Apply veg/non-veg filter first
                let filteredByVeg = items;
                if (vegFilter === 'veg') {
                  filteredByVeg = items.filter(item => item.is_veg === 1 || item.is_veg === true);
                } else if (vegFilter === 'nonveg') {
                  filteredByVeg = items.filter(item => item.is_veg === 0 || item.is_veg === false);
                }
                
                // Then apply search filter
                const filteredItems = searchTerm 
                  ? filteredByVeg.filter(item => 
                      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  : filteredByVeg;
                
                if (filteredItems.length === 0) {
                  const filterText = vegFilter === 'veg' ? ' vegetarian' : vegFilter === 'nonveg' ? ' non-vegetarian' : '';
                  const message = searchTerm 
                    ? `No${filterText} items found for "${searchTerm}" in ${selectedCategory}`
                    : `No${filterText} items available in ${selectedCategory}`;
                  return (
                    <div style={{ 
                      textAlign:'center', 
                      padding:40, 
                      background:'#fff', 
                      borderRadius:12, 
                      color:'#6b7280',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {message}
                    </div>
                  );
                }
                
                return filteredItems.map((item) => (
                  <div key={item.id} style={{ background:'#fff', borderRadius:12, boxShadow:'0 4px 10px rgba(0,0,0,.06)', border:'1px solid #e5e7eb', overflow:'hidden' }}>
                    <div style={{ padding:16 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:8, flex:1, minWidth:0 }}>
                          <div style={{ paddingTop:2, flexShrink:0 }}>
                            <VegNonVegIcon isVeg={item.is_veg} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <h3 style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:4, lineHeight:1.4 }}>{item.name}</h3>
                            {item.description && (<p style={{ fontSize:14, color:'#6b7280', textAlign:'left', margin:0, lineHeight:1.5 }}>{item.description}</p>)}
                          </div>
                        </div>
                        <span style={{ fontSize:18, fontWeight:700, color:'#059669', whiteSpace:'nowrap', flexShrink:0 }}>₹{parseFloat(item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Give Feedback Section - After Categories */}
        {!selectedCategory && (
          <div style={{ padding: '16px', paddingBottom: '24px', marginTop: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  padding: '12px',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '32px', height: '32px', color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                How was your experience?
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                We'd love to hear your feedback! Share your thoughts about our food, service, and ambiance.
              </p>
              <button
                onClick={() => setShowFeedbackForm(true)}
                style={{
                  background: '#fff',
                  color: '#2563eb',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                }}
              >
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Give Feedback
              </button>
            </div>
          </div>
        )}

        {/* Feedback Form Modal */}
        {showFeedbackForm && restaurant && (
          <FeedbackForm
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            onClose={() => setShowFeedbackForm(false)}
          />
        )}

        {/* Tax Note */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 4px 10px rgba(0,0,0,.06)', 
          border: '1px solid #e5e7eb', 
          padding: '16px',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            margin: '0',
            lineHeight: '1.4'
          }}>
            All menu item prices are exclusive of applicable taxes. Taxes will be added to the final bill as per Government of India regulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicMenu;


