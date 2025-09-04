import React from 'react';
import { JsonLd } from 'react-schemaorg';

const SchemaMarkup = ({ type = 'website' }) => {
  const baseUrl = 'https://martingale-strategy-calc.vercel.app';

  // WebSite schema for homepage
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Martingale Strategy Calculator',
    'url': baseUrl,
    'description': 'Free online Martingale betting calculator for roulette and other casino games. Test the Martingale strategy with comprehensive risk analysis and simulations.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${baseUrl}/#configure`,
      'query-input': 'required name=search_term_string'
    }
  };

  // SoftwareApplication schema for calculator page
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Martingale Betting Calculator',
    'operatingSystem': 'All',
    'applicationCategory': 'FinanceApplication',
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.7',
      'ratingCount': '250'
    },
    'offers': {
      '@type': 'Offer',
      'price': '0.00',
      'priceCurrency': 'USD'
    },
    'url': `${baseUrl}/#configure`,
    'description': 'Free Martingale Calculator to simulate betting rounds, manage bankroll, and test the martingale strategy safely with detailed risk analysis.',
    'featureList': [
      'Bankroll Management',
      'Risk Analysis',
      'Monte Carlo Simulation',
      'Progressive Betting Calculator',
      'Probability Calculations'
    ],
    'screenshot': `${baseUrl}/logo512.png`
  };

  // Organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Martingale Calculator',
    'url': baseUrl,
    'logo': `${baseUrl}/logo192.png`,
    'sameAs': []
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': baseUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Calculator',
        'item': `${baseUrl}/#configure`
      }
    ]
  };

  const getSchemaByType = () => {
    switch (type) {
      case 'software':
        return softwareApplicationSchema;
      case 'organization':
        return organizationSchema;
      case 'breadcrumb':
        return breadcrumbSchema;
      case 'website':
      default:
        return websiteSchema;
    }
  };

  return (
    <>
      <JsonLd
        item={getSchemaByType()}
      />
      
      {/* Always include Organization schema */}
      {type !== 'organization' && (
        <JsonLd
          item={organizationSchema}
        />
      )}
      
      {/* Include Breadcrumb schema for all pages except homepage */}
      {type !== 'website' && (
        <JsonLd
          item={breadcrumbSchema}
        />
      )}
    </>
  );
};

export default SchemaMarkup;