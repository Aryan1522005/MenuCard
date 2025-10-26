import React from 'react';

const RestaurantInfo = ({ restaurant }) => {
  if (!restaurant) return null;

  const { address, phone, wifi_name, wifi_password, custom_sections, description } = restaurant;

  return (
    <div style={{ 
      background: '#f8f9fa', 
      padding: '16px',
      marginTop: '0'
    }}>
      <div className="container mx-auto px-4" style={{ maxWidth: 420 }}>
        {/* Description */}
        {description && (
          <div style={{ 
            marginBottom: '12px',
            textAlign: 'left'
          }}>
            <p style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              lineHeight: '1.4',
              margin: '0'
            }}>
              {description}
            </p>
          </div>
        )}

        {/* Address */}
        {address && (
          <div style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ 
              color: '#dc2626', 
              fontSize: '14px',
              flexShrink: 0,
              width: '16px',
              display: 'inline-block',
              lineHeight: '1.3'
            }}>📍</span>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              lineHeight: '1.3',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              textAlign: 'left',
              flex: 1
            }}>
              {address}
            </div>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ 
              color: '#dc2626', 
              fontSize: '14px',
              flexShrink: 0,
              width: '16px',
              display: 'inline-block',
              lineHeight: '1.3'
            }}>📞</span>
            <a 
              href={`tel:${phone}`} 
              style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                textDecoration: 'none',
                lineHeight: '1.3',
                textAlign: 'left',
                flex: 1
              }}
            >
              {phone}
            </a>
          </div>
        )}

        {/* WiFi Name */}
        {wifi_name && (
          <div style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{ 
              width: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              paddingTop: '1px'
            }}>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
            <span style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              lineHeight: '1.3',
              textAlign: 'left',
              flex: 1
            }}>
              {wifi_name}
            </span>
          </div>
        )}

        {/* WiFi Password */}
        {wifi_password && (
          <div style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ 
              color: '#f59e0b', 
              fontSize: '14px',
              flexShrink: 0,
              width: '16px',
              display: 'inline-block',
              lineHeight: '1.3'
            }}>🔒</span>
            <span style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              lineHeight: '1.3',
              textAlign: 'left',
              flex: 1
            }}>
              {wifi_password}
            </span>
          </div>
        )}

        {/* Custom Sections */}
        {custom_sections && Array.isArray(custom_sections) && custom_sections.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {custom_sections.map((section, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '4px',
                  textAlign: 'left',
                  lineHeight: '1.3'
                }}>
                  {section.title}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  lineHeight: '1.3',
                  textAlign: 'left'
                }}>
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantInfo;
