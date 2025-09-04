import React, { useState } from 'react';
import { AlertTriangle, Shield, TrendingDown, Info, X, CheckCircle2 } from 'lucide-react';
import { generateRiskWarnings } from '../utils/martingaleCalculator';

const RiskWarnings = ({ config, statistics, onAcknowledge }) => {
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(new Set());
  const [showDetails, setShowDetails] = useState(false);

  if (!config || !statistics) {
    return null;
  }

  const warnings = generateRiskWarnings(config, statistics);
  const criticalWarnings = warnings.filter(w => w.type === 'high-risk' || w.type === 'negative-ev');
  const moderateWarnings = warnings.filter(w => !criticalWarnings.includes(w));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  const handleAcknowledgeWarning = (warningIndex) => {
    const newAcknowledged = new Set(acknowledgedWarnings);
    newAcknowledged.add(warningIndex);
    setAcknowledgedWarnings(newAcknowledged);
  };

  const allWarningsAcknowledged = warnings.length > 0 && acknowledgedWarnings.size === warnings.length;

  const getWarningIcon = (type) => {
    switch (type) {
      case 'high-risk':
      case 'negative-ev':
        return <AlertTriangle size={20} className="text-red-500" />;
      case 'bankroll':
      case 'large-bet':
        return <TrendingDown size={20} className="text-orange-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getWarningStyle = (type) => {
    switch (type) {
      case 'high-risk':
      case 'negative-ev':
        return 'warning-critical';
      case 'bankroll':
      case 'large-bet':
        return 'warning-moderate';
      default:
        return 'warning-info';
    }
  };

  return (
    <div className="risk-warnings-container">
      {/* Main Risk Assessment */}
      <div className="risk-assessment">
        <div className="risk-header">
          <Shield size={24} />
          <h3>Risk Assessment</h3>
        </div>

        <div className="risk-summary">
          <div className="risk-level">
            <span className="risk-label">Overall Risk Level:</span>
            <span className={`risk-badge ${criticalWarnings.length > 0 ? 'high' : moderateWarnings.length > 0 ? 'moderate' : 'low'}`}>
              {criticalWarnings.length > 0 ? 'HIGH RISK' : moderateWarnings.length > 0 ? 'MODERATE RISK' : 'LOW RISK'}
            </span>
          </div>
          
          <div className="key-metrics">
            <div className="metric">
              <span>Bust Probability:</span>
              <span className={statistics.bustProbability > 10 ? 'text-red' : statistics.bustProbability > 5 ? 'text-orange' : 'text-green'}>
                {formatPercentage(statistics.bustProbability)}
              </span>
            </div>
            <div className="metric">
              <span>Expected Value:</span>
              <span className={statistics.expectedValue < 0 ? 'text-red' : 'text-green'}>
                {formatCurrency(statistics.expectedValue)}
              </span>
            </div>
            <div className="metric">
              <span>Max Potential Loss:</span>
              <span className="text-red">{formatCurrency(statistics.worstCaseScenario)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specific Warnings */}
      {warnings.length > 0 && (
        <div className="warnings-section">
          <h4>Risk Warnings</h4>
          <p>Please review and acknowledge the following risks before proceeding:</p>
          
          <div className="warnings-list">
            {warnings.map((warning, index) => (
              <div key={index} className={`warning-item ${getWarningStyle(warning.type)}`}>
                <div className="warning-content">
                  <div className="warning-icon">
                    {getWarningIcon(warning.type)}
                  </div>
                  <div className="warning-text">
                    <strong>{warning.type.replace('-', ' ').toUpperCase()}:</strong> {warning.message}
                  </div>
                  <div className="warning-actions">
                    {acknowledgedWarnings.has(index) ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <button
                        onClick={() => handleAcknowledgeWarning(index)}
                        className="acknowledge-button"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bankroll Management Guidelines */}
      <div className="bankroll-guidelines">
        <h4>Bankroll Management Guidelines</h4>
        
        <div className="guidelines-grid">
          <div className="guideline-card">
            <h5>Recommended Bankroll</h5>
            <div className="guideline-value">{formatCurrency(statistics.recommendedBankroll)}</div>
            <p>Conservative recommendation for your base bet size</p>
            <div className="comparison">
              Your bankroll: {formatCurrency(config.bankroll)} 
              {config.bankroll >= statistics.recommendedBankroll ? (
                <span className="status-good">✓ Adequate</span>
              ) : (
                <span className="status-poor">⚠ Insufficient</span>
              )}
            </div>
          </div>

          <div className="guideline-card">
            <h5>Kelly Criterion</h5>
            <div className="guideline-value">{formatPercentage(statistics.kellyCriterion)}</div>
            <p>Optimal bet size as percentage of bankroll</p>
            <div className="kelly-analysis">
              {statistics.kellyCriterion === 0 ? (
                <span className="status-poor">❌ Don't bet - unfavorable odds</span>
              ) : statistics.kellyCriterion < 1 ? (
                <span className="status-poor">⚠ Very small optimal bet size</span>
              ) : (
                <span className="status-good">✓ Positive Kelly value</span>
              )}
            </div>
          </div>

          <div className="guideline-card">
            <h5>Risk of Ruin</h5>
            <div className="guideline-value">{formatPercentage(statistics.riskOfRuin)}</div>
            <p>Probability of losing entire bankroll</p>
            <div className="ruin-analysis">
              {statistics.riskOfRuin > 50 ? (
                <span className="status-poor">❌ Very high risk</span>
              ) : statistics.riskOfRuin > 20 ? (
                <span className="status-poor">⚠ High risk</span>
              ) : statistics.riskOfRuin > 5 ? (
                <span className="status-moderate">⚠ Moderate risk</span>
              ) : (
                <span className="status-good">✓ Low risk</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="educational-section">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="details-toggle"
        >
          <Info size={16} />
          {showDetails ? 'Hide' : 'Show'} Detailed Risk Explanation
        </button>

        {showDetails && (
          <div className="risk-education">
            <div className="education-grid">
              <div className="education-card">
                <h5>Martingale Strategy Risks</h5>
                <ul>
                  <li>Exponential bet growth can quickly exhaust bankroll</li>
                  <li>Table limits can prevent recovery after losses</li>
                  <li>Long losing streaks, while rare, do occur</li>
                  <li>Even small house edges lead to negative expected value</li>
                </ul>
              </div>

              <div className="education-card">
                <h5>Bankroll Management</h5>
                <ul>
                  <li>Never bet more than you can afford to lose</li>
                  <li>Set strict loss limits before starting</li>
                  <li>Consider position sizing based on Kelly Criterion</li>
                  <li>Account for table limits in your strategy</li>
                </ul>
              </div>

              <div className="education-card">
                <h5>Statistical Reality</h5>
                <ul>
                  <li>Past results don't affect future outcomes</li>
                  <li>Losing streaks of 10+ rounds occur more often than expected</li>
                  <li>Expected value determines long-term results</li>
                  <li>Variance can cause significant short-term swings</li>
                </ul>
              </div>
            </div>

            <div className="probability-examples">
              <h5>Losing Streak Probabilities</h5>
              <div className="probability-table">
                <div className="prob-header">
                  <span>Consecutive Losses</span>
                  <span>Probability</span>
                  <span>Occurs About</span>
                </div>
                {[5, 7, 10, 15, 20].map(streak => {
                  const probability = Math.pow(1 - config.winProbability / 100, streak) * 100;
                  const frequency = probability > 0.01 ? `1 in ${Math.round(100 / probability)}` : 'Very rare';
                  return (
                    <div key={streak} className="prob-row">
                      <span>{streak} losses</span>
                      <span>{formatPercentage(probability)}</span>
                      <span>{frequency}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {warnings.length > 0 && (
        <div className="warning-actions">
          <div className="action-status">
            {allWarningsAcknowledged ? (
              <span className="status-complete">
                <CheckCircle2 size={16} />
                All risks acknowledged
              </span>
            ) : (
              <span className="status-pending">
                Please acknowledge all warnings ({acknowledgedWarnings.size}/{warnings.length})
              </span>
            )}
          </div>

          <button
            onClick={() => onAcknowledge && onAcknowledge(allWarningsAcknowledged)}
            disabled={!allWarningsAcknowledged}
            className={`proceed-button ${allWarningsAcknowledged ? 'enabled' : 'disabled'}`}
          >
            {allWarningsAcknowledged ? 'Proceed with Strategy' : 'Acknowledge All Warnings First'}
          </button>
        </div>
      )}

      {warnings.length === 0 && (
        <div className="no-warnings">
          <CheckCircle2 size={24} className="text-green-500" />
          <h4>Low Risk Configuration</h4>
          <p>Your current configuration shows relatively low risk. However, please remember that all gambling involves risk.</p>
          <button
            onClick={() => onAcknowledge && onAcknowledge(true)}
            className="proceed-button enabled"
          >
            Continue with Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default RiskWarnings;