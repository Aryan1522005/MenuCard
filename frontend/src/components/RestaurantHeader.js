import React from 'react';

const RestaurantHeader = ({ restaurant }) => {
  // Use restaurant's image_url if available, otherwise use default
  const defaultRestaurantImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop&crop=center';
  
  // Normalize image URL to handle Google Images redirect links
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
  
  const restaurantImage = restaurant?.image_url ? normalizeImageUrl(restaurant.image_url) : defaultRestaurantImage;
  

  return (
    <div>
      {/* Image/Background Section with only restaurant name */}
      <div style={{
        position: 'relative',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <img
          src={restaurantImage}
          alt={restaurant.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
          onError={(e) => {
            console.log('Restaurant image failed to load, using default');
            e.target.src = defaultRestaurantImage;
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1
        }} />
        
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {restaurant.logo_url && (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="rounded-full object-cover border-4 border-white shadow-lg"
                style={{ width: 80, height: 80 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: 'white', 
            lineHeight: 1.2, 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)', 
            letterSpacing: '1px', 
            textTransform: 'uppercase'
          }}>
            {restaurant.name}
          </h1>
        </div>
      </div>
      
    </div>
  );
};

export default RestaurantHeader;
