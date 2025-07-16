import React from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  currentStation?: {
    name: string;
    country: string;
    genre: string;
    url: string;
  };
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Top.emisoras - Radio Online Gratis | Emisoras Colombianas y Latinas",
  description = "Escucha radio online gratis. Miles de emisoras colombianas, latinas y del mundo. Búsqueda por voz, favoritos y streaming en alta calidad. Radio en vivo 24/7.",
  keywords = "radio online, radio gratis, emisoras colombianas, radio latina, streaming radio, radio en vivo, música online, radio internet, emisoras gratis, radio colombiana, radio latinoamericana, búsqueda por voz, favoritos radio",
  image = "https://www.webcincodev.com/blog/wp-content/uploads/2025/07/radio.gratis-1.png",
  url = "https://top.emisoras.com",
  type = "website",
  currentStation
}) => {
  // Generate structured data based on current station
  const generateStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Top.emisoras",
      "description": "Aplicación web para escuchar radio online gratis con emisoras colombianas, latinas y del mundo",
      "url": "https://top.emisoras.com",
      "applicationCategory": "EntertainmentApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Radio online gratis",
        "Emisoras colombianas",
        "Radio latina",
        "Búsqueda por voz",
        "Lista de favoritos",
        "Streaming en alta calidad",
        "Radio en vivo 24/7"
      ],
      "screenshot": "https://www.webcincodev.com/blog/wp-content/uploads/2025/07/radio.gratis-1.png",
      "author": {
        "@type": "Organization",
        "name": "Top.emisoras"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Top.emisoras",
        "logo": {
          "@type": "ImageObject",
          "url": "https://top.emisoras.com/logo.png"
        }
      }
    };

    // Add radio station data if available
    if (currentStation) {
      return [
        baseData,
        {
          "@context": "https://schema.org",
          "@type": "RadioStation",
          "name": currentStation.name,
          "description": `Escuchando ${currentStation.name} - ${currentStation.genre} desde ${currentStation.country}`,
          "url": currentStation.url,
          "genre": currentStation.genre,
          "areaServed": {
            "@type": "Country",
            "name": currentStation.country
          },
          "broadcastDisplayName": currentStation.name,
          "inLanguage": "es"
        }
      ];
    }

    return [baseData];
  };

  React.useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updatePropertyTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updatePropertyTag('og:title', title);
    updatePropertyTag('og:description', description);
    updatePropertyTag('og:image', image);
    updatePropertyTag('og:url', url);
    updatePropertyTag('og:type', type);
    updatePropertyTag('twitter:title', title);
    updatePropertyTag('twitter:description', description);
    updatePropertyTag('twitter:image', image);
    updatePropertyTag('twitter:url', url);

    // Update structured data
    const structuredData = generateStructuredData();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);

    // Track page view for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: title,
        page_location: url,
        custom_map: {
          'custom_parameter_1': 'radio_type',
          'custom_parameter_2': currentStation?.country || 'general'
        }
      });
    }

    // Track Facebook pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }

  }, [title, description, keywords, image, url, type, currentStation]);

  return null; // This component doesn't render anything
};

export default SEOHead; 