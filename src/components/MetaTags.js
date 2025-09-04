import React from 'react';
import { Helmet } from 'react-helmet-async';

const MetaTags = ({ 
  title = "Martingale Calculator | Free Martingale Strategy Tool",
  description = "Use our free Martingale Calculator to plan your bets, manage bankroll, and test the martingale strategy safely. Try the Martingale Betting Calculator now!",
  keywords = "martingale calculator, betting strategy, bankroll management, risk calculation, gambling calculator, martingale system, betting simulator",
  canonical = "",
  ogTitle = "",
  ogDescription = "",
  ogImage = ""
}) => {
  // Default Open Graph values if not provided
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalOgImage = ogImage || `${window.location.origin}/logo192.png`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={finalOgImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={window.location.href} />
      <meta property="twitter:title" content={finalOgTitle} />
      <meta property="twitter:description" content={finalOgDescription} />
      <meta property="twitter:image" content={finalOgImage} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Martingale Calculator" />
    </Helmet>
  );
};

// Predefined meta configurations for different pages
export const META_CONFIGS = {
  HOME: {
    title: "Martingale Calculator | Free Martingale Strategy Tool",
    description: "Use our free Martingale Calculator to plan your bets, manage bankroll, and test the martingale strategy safely. Try the Martingale Betting Calculator now!",
    keywords: "martingale calculator, betting strategy, bankroll management, risk calculation, gambling calculator, martingale system, betting simulator"
  },
  BLOG: {
    title: "How the Martingale System Works | Martingale Strategy Guide",
    description: "Learn how the Martingale betting system works, its risks and rewards. Complete guide to understanding and using the Martingale strategy calculator effectively.",
    keywords: "martingale system, betting strategy guide, how martingale works, gambling strategy, risk management"
  },
  SIMULATION: {
    title: "Martingale Simulation | Test Your Betting Strategy Safely",
    description: "Run Monte Carlo simulations to test your Martingale betting strategy. Analyze risk, calculate probabilities, and optimize your bankroll management.",
    keywords: "martingale simulation, monte carlo simulation, betting strategy test, risk analysis, probability calculator"
  },
  RISK_ANALYSIS: {
    title: "Martingale Risk Analysis | Understand Betting Strategy Risks",
    description: "Comprehensive risk analysis for Martingale betting strategy. Calculate potential losses, understand risk factors, and make informed betting decisions.",
    keywords: "martingale risk analysis, betting risk calculator, gambling risk assessment, strategy evaluation"
  }
};

export default MetaTags;