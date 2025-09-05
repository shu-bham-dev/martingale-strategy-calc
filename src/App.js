import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Calculator, BarChart3, Play, AlertTriangle, FileText } from 'lucide-react';

// Import components
import InputForm from './components/InputForm';
import ResultsTable from './components/ResultsTable';
import Charts from './components/Charts';
import SimulationMode from './components/SimulationMode';
import RiskWarnings from './components/RiskWarnings';
import MetaTags, { META_CONFIGS } from './components/MetaTags';
import SchemaMarkup from './components/SchemaMarkup';

// Import utilities
import { calculateMartingaleProgression, generateRiskWarnings } from './utils/martingaleCalculator';

// Import styles
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('configure');
  const [calculationConfig, setCalculationConfig] = useState(null);
  const [calculationResults, setCalculationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showRiskWarnings, setShowRiskWarnings] = useState(false);
  const [risksAcknowledged, setRisksAcknowledged] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState({});

  // Tab configuration
  const tabs = [
    {
      id: 'configure',
      label: 'Configure',
      icon: Calculator,
      description: 'Set up your Martingale strategy parameters'
    },
    {
      id: 'results',
      label: 'Results',
      icon: FileText,
      description: 'View detailed progression analysis',
      disabled: !calculationResults
    },
    {
      id: 'charts',
      label: 'Charts',
      icon: BarChart3,
      description: 'Visual analysis and insights',
      disabled: !calculationResults
    },
    {
      id: 'simulation',
      label: 'Simulation',
      icon: Play,
      description: 'Monte Carlo simulation',
      disabled: !calculationResults
    },
    {
      id: 'risks',
      label: 'Risk Analysis',
      icon: AlertTriangle,
      description: 'Risk assessment and warnings',
      disabled: !calculationResults
    }
  ];

  // Handle calculation request
  const handleCalculate = async (config) => {
    setIsCalculating(true);
    setCalculationConfig(config);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate results
      const results = calculateMartingaleProgression(config);
      
      // Check for high-risk scenarios
      const warnings = generateRiskWarnings(config, results.statistics);
      const hasHighRiskWarnings = warnings.some(w => w.type === 'high-risk' || w.type === 'negative-ev');
      
      if (hasHighRiskWarnings && !risksAcknowledged) {
        setShowRiskWarnings(true);
        setCalculationResults(results);
        setActiveTab('risks');
        toast.error('High-risk configuration detected. Please review warnings.');
      } else {
        setCalculationResults(results);
        setActiveTab('results');
        toast.success('Calculation completed successfully!');
      }
      
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('An error occurred during calculation. Please check your inputs.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle risk acknowledgment
  const handleRiskAcknowledgment = (acknowledged) => {
    setRisksAcknowledged(acknowledged);
    setShowRiskWarnings(false);
    
    if (acknowledged) {
      setActiveTab('results');
      toast.success('Risks acknowledged. Proceeding with analysis.');
    }
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    toast.success('Data exported to CSV successfully!');
  };

  // Handle copy functionality
  const handleCopy = () => {
    toast.success('Table data copied to clipboard!');
  };

  // Reset application state
  const handleReset = () => {
    setCalculationResults(null);
    setCalculationConfig(null);
    setRisksAcknowledged(false);
    setShowRiskWarnings(false);
    setActiveTab('configure');
    toast.success('Application reset successfully!');
  };

  // Toggle FAQ expansion
  const toggleFaq = (faqIndex) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [faqIndex]: !prev[faqIndex]
    }));
  };

  // Auto-switch to results tab when calculation completes
  useEffect(() => {
    if (calculationResults && !showRiskWarnings && activeTab === 'configure') {
      setActiveTab('results');
    }
  }, [calculationResults, showRiskWarnings, activeTab]);

  // Get meta tags configuration based on active tab
  const getMetaConfig = () => {
    switch (activeTab) {
      case 'configure':
        return META_CONFIGS.HOME;
      case 'results':
        return META_CONFIGS.HOME;
      case 'charts':
        return META_CONFIGS.HOME;
      case 'simulation':
        return META_CONFIGS.SIMULATION;
      case 'risks':
        return META_CONFIGS.RISK_ANALYSIS;
      default:
        return META_CONFIGS.HOME;
    }
  };

  const metaConfig = getMetaConfig();

  // Get schema type based on active tab
  const getSchemaType = () => {
    switch (activeTab) {
      case 'configure':
      case 'results':
      case 'charts':
      case 'simulation':
      case 'risks':
        return 'software';
      default:
        return 'website';
    }
  };

  return (
    <div className="App">
      {/* Meta Tags */}
      <MetaTags {...metaConfig} />
      
      {/* Schema Markup */}
      <SchemaMarkup type={getSchemaType()} />
      
      {/* <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      /> */}

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-title">
            <Calculator size={32} />
            <span className="header-title-text">
              Martingale Calculator – Free Martingale Strategy Simulator
            </span>
          </h1>
          <p className="header-subtitle">
            Use our advanced Martingale betting calculator to test strategies, manage bankroll, and understand the risks of progressive betting systems.
          </p>
        </div>
      </header>

      {/* Top Promotional Banner */}
      <section className="top-promotional-banner">
        <div className="promotional-content">
          <a href="https://stake.bet/?c=2uo9ldlS" target="_blank" rel="noopener noreferrer">
            <img
              src={`${process.env.PUBLIC_URL}/martigale strategy calculater.webp`}
              alt="Martingale Strategy Calculator - Stake Casino"
              className="top-promotional-image"
              loading="lazy"
            />
          </a>
          <div className="promotional-text-content">
            <h3>Try Your Strategies at Stake Casino</h3>
            <p>Get the best experience with our recommended casino platform</p>
            <a href="https://stake.bet/?c=2uo9ldlS" target="_blank" rel="noopener noreferrer" className="promotional-button">
              Visit Stake Casino
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-container">

        {/* Tab Navigation */}
        <nav className="tab-navigation">
          <div className="tab-list">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                  disabled={tab.disabled}
                  title={tab.description}
                >
                  <IconComponent size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          {calculationResults && (
            <div className="tab-actions">
              <button onClick={handleReset} className="action-button secondary">
                Reset Calculator
              </button>
            </div>
          )}
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'configure' && (
            <InputForm 
              onCalculate={handleCalculate}
              loading={isCalculating}
            />
          )}

          {activeTab === 'results' && calculationResults && (
            <ResultsTable 
              results={calculationResults}
              onExport={handleExport}
              onCopy={handleCopy}
            />
          )}

          {activeTab === 'charts' && calculationResults && (
            <Charts results={calculationResults} />
          )}

          {activeTab === 'simulation' && calculationResults && (
            <SimulationMode config={calculationConfig} />
          )}

          {activeTab === 'risks' && calculationResults && (
            <RiskWarnings 
              config={calculationConfig}
              statistics={calculationResults.statistics}
              onAcknowledge={handleRiskAcknowledgment}
            />
          )}
        </div>

        {/* Progress Indicator */}
        {calculationResults && (
          <div className="progress-indicator">
            <div className="progress-steps">
              <div className={`step ${activeTab === 'configure' ? 'active' : 'completed'}`}>
                <Calculator size={16} />
                <span>Configure</span>
              </div>
              <div className={`step ${activeTab === 'results' ? 'active' : calculationResults ? 'completed' : ''}`}>
                <FileText size={16} />
                <span>Results</span>
              </div>
              <div className={`step ${activeTab === 'charts' ? 'active' : ''}`}>
                <BarChart3 size={16} />
                <span>Charts</span>
              </div>
              <div className={`step ${activeTab === 'simulation' ? 'active' : ''}`}>
                <Play size={16} />
                <span>Simulation</span>
              </div>
              <div className={`step ${activeTab === 'risks' ? 'active' : ''}`}>
                <AlertTriangle size={16} />
                <span>Risk Analysis</span>
              </div>
            </div>
          </div>
        )}

        {/* Educational Content Section */}
        <section className="educational-content">
          <div className="content-section">
            <h2>How to Use the Martingale System Calculator</h2>
            <p>
              Our Martingale betting calculator helps you simulate progressive betting strategies with real-time risk analysis.
              Simply configure your initial bet, bankroll, odds, and number of rounds to see how the Martingale strategy performs.
            </p>
            
            <h3>Benefits of a Martingale Betting Calculator</h3>
            <ul>
              <li><strong>Risk Assessment</strong>: Understand potential losses before placing real bets</li>
              <li><strong>Bankroll Management</strong>: Calculate optimal bet sizes for your budget</li>
              <li><strong>Strategy Testing</strong>: Compare Martingale vs other betting systems</li>
              <li><strong>Probability Analysis</strong>: See success rates with different configurations</li>
            </ul>
            
            <h3>Martingale Strategy Calculator vs. Other Betting Tools</h3>
            <p>
              Unlike simple betting calculators, our Martingale system calculator provides comprehensive Monte Carlo simulations,
              detailed risk warnings, and visual analytics to help you make informed decisions about progressive betting strategies.
            </p>
            
            <div className="cta-section">
              <h3>Ready to Test Your Strategy?</h3>
              <p>
                Try our free Martingale Betting Calculator now and plan your bets smarter.
                Whether you're testing roulette strategies or other casino games, our tool provides the insights you need.
              </p>
              <div className="promotional-section">
                <a href="https://stake.bet/?c=2uo9ldlS" target="_blank" rel="noopener noreferrer">
                  <img
                    src={`${process.env.PUBLIC_URL}/martigale strategy calculater.webp`}
                    alt="Martingale Strategy Calculator - Stake Casino"
                    className="promotional-image"
                    loading="lazy"
                  />
                </a>
                <p className="promotional-text">
                  <strong>Recommended Casino:</strong> Try your strategies at{' '}
                  <a href="https://stake.bet/?c=2uo9ldlS" target="_blank" rel="noopener noreferrer">
                    Stake Casino
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="content-section">
            <h2>Frequently Asked Questions</h2>
            
            {[
              {
                question: "Is the Martingale system safe?",
                answer: "The Martingale betting strategy carries significant risk. While it can produce short-term wins, it requires an unlimited bankroll to guarantee long-term success, which is impractical. Our Martingale calculator helps you understand these risks before implementing the strategy."
              },
              {
                question: "What is the best Martingale strategy?",
                answer: "The 'best' Martingale strategy depends on your bankroll, risk tolerance, and game odds. Our Martingale system calculator allows you to test different configurations to find the optimal approach for your specific situation."
              },
              {
                question: "How does the Martingale calculator work?",
                answer: "Our Martingale betting calculator simulates progressive betting rounds based on your inputs (initial bet, bankroll, odds, rounds). It calculates potential outcomes, success rates, and provides risk warnings to help you make informed decisions."
              },
              {
                question: "Can I use this for roulette strategies?",
                answer: "Yes! Our Martingale calculator is perfect for testing roulette strategies, as well as other casino games with near 50/50 odds. The tool helps you understand how the Martingale system performs in different gambling scenarios."
              },
              {
                question: "What bankroll do I need for Martingale?",
                answer: "The required bankroll depends on your initial bet and the number of consecutive losses you want to withstand. Our Martingale strategy calculator helps you determine the optimal bankroll size for your chosen parameters."
              }
            ].map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={expandedFaqs[index]}
                >
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle">
                    {expandedFaqs[index] ? '−' : '+'}
                  </span>
                </button>
                {expandedFaqs[index] && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
