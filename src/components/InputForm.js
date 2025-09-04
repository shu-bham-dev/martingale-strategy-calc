import React, { useState, useEffect } from 'react';
import { OddsType, validateOdds, formatOdds, convertToDecimal } from '../utils/oddsConverter';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, Info } from 'lucide-react';

const InputForm = ({ onCalculate, loading }) => {
  const [formData, setFormData] = useState({
    baseBet: '10',
    bankroll: '1000',
    odds: '2.00',
    oddsType: OddsType.DECIMAL,
    maxRounds: '10',
    targetProfit: '',
    betMultiplier: '2',
    maxTableLimit: ''
  });

  const [errors, setErrors] = useState({});
  const [oddsPreview, setOddsPreview] = useState({});

  // Update odds preview when odds or type changes
  useEffect(() => {
    if (formData.odds && !errors.odds) {
      try {
        const decimal = convertToDecimal(formData.odds, formData.oddsType);
        setOddsPreview({
          decimal: formatOdds(decimal, OddsType.DECIMAL),
          american: formatOdds(decimal, OddsType.AMERICAN),
          fractional: formatOdds(decimal, OddsType.FRACTIONAL),
          implied: formatOdds(decimal, OddsType.IMPLIED)
        });
      } catch (e) {
        setOddsPreview({});
      }
    }
  }, [formData.odds, formData.oddsType, errors.odds]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate base bet
    const baseBet = parseFloat(formData.baseBet);
    if (!formData.baseBet || isNaN(baseBet) || baseBet <= 0) {
      newErrors.baseBet = 'Base bet must be a positive number';
    }

    // Validate bankroll
    const bankroll = parseFloat(formData.bankroll);
    if (!formData.bankroll || isNaN(bankroll) || bankroll <= 0) {
      newErrors.bankroll = 'Bankroll must be a positive number';
    } else if (baseBet && bankroll < baseBet) {
      newErrors.bankroll = 'Bankroll must be greater than base bet';
    }

    // Validate odds
    const oddsValidation = validateOdds(formData.odds, formData.oddsType);
    if (!oddsValidation.isValid) {
      newErrors.odds = oddsValidation.errors[0];
    }

    // Validate max rounds
    const maxRounds = parseInt(formData.maxRounds);
    if (!formData.maxRounds || isNaN(maxRounds) || maxRounds < 1 || maxRounds > 50) {
      newErrors.maxRounds = 'Max rounds must be between 1 and 50';
    }

    // Validate target profit (optional)
    if (formData.targetProfit) {
      const targetProfit = parseFloat(formData.targetProfit);
      if (isNaN(targetProfit) || targetProfit <= 0) {
        newErrors.targetProfit = 'Target profit must be a positive number';
      }
    }

    // Validate bet multiplier
    const betMultiplier = parseFloat(formData.betMultiplier);
    if (!formData.betMultiplier || isNaN(betMultiplier) || betMultiplier < 1.1 || betMultiplier > 10) {
      newErrors.betMultiplier = 'Bet multiplier must be between 1.1 and 10';
    }

    // Validate table limit (optional)
    if (formData.maxTableLimit) {
      const tableLimit = parseFloat(formData.maxTableLimit);
      if (isNaN(tableLimit) || tableLimit <= 0) {
        newErrors.maxTableLimit = 'Table limit must be a positive number';
      } else if (baseBet && tableLimit < baseBet) {
        newErrors.maxTableLimit = 'Table limit must be greater than base bet';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const config = {
        baseBet: parseFloat(formData.baseBet),
        bankroll: parseFloat(formData.bankroll),
        odds: formData.odds,
        oddsType: formData.oddsType,
        maxRounds: parseInt(formData.maxRounds),
        targetProfit: formData.targetProfit ? parseFloat(formData.targetProfit) : null,
        betMultiplier: parseFloat(formData.betMultiplier),
        maxTableLimit: formData.maxTableLimit ? parseFloat(formData.maxTableLimit) : null
      };
      onCalculate(config);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    error, 
    type = 'number', 
    step, 
    min, 
    max, 
    placeholder,
    icon: Icon,
    tooltip,
    optional = false
  }) => (
    <div className="input-group">
      <label className="input-label">
        {Icon && <Icon size={16} />}
        {label} {optional && <span className="optional">(optional)</span>}
        {tooltip && (
          <div className="tooltip">
            <Info size={14} />
            <span className="tooltip-text">{tooltip}</span>
          </div>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`input-field ${error ? 'error' : ''}`}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  return (
    <div className="input-form">
      <div className="form-header">
        <h2>
          <Calculator size={24} />
          Martingale Strategy Configuration
        </h2>
        <p>Configure your betting parameters and analyze the progression</p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Basic Betting Parameters */}
        <div className="form-section">
          <h3>Basic Parameters</h3>
          
          <InputField
            label="Base Bet Amount"
            value={formData.baseBet}
            onChange={(value) => handleInputChange('baseBet', value)}
            error={errors.baseBet}
            step="0.01"
            min="0.01"
            placeholder="10.00"
            icon={DollarSign}
            tooltip="The initial bet amount for the first round"
          />

          <InputField
            label="Total Bankroll"
            value={formData.bankroll}
            onChange={(value) => handleInputChange('bankroll', value)}
            error={errors.bankroll}
            step="0.01"
            min="0.01"
            placeholder="1000.00"
            icon={DollarSign}
            tooltip="Your total available funds for this session"
          />

          <InputField
            label="Max Rounds"
            value={formData.maxRounds}
            onChange={(value) => handleInputChange('maxRounds', value)}
            error={errors.maxRounds}
            type="number"
            min="1"
            max="50"
            placeholder="10"
            tooltip="Maximum number of consecutive losses to analyze"
          />
        </div>

        {/* Odds Configuration */}
        <div className="form-section">
          <h3>Odds Configuration</h3>
          
          <div className="odds-input-group">
            <div className="odds-type-selector">
              <label className="input-label">Odds Format</label>
              <select
                value={formData.oddsType}
                onChange={(e) => handleInputChange('oddsType', e.target.value)}
                className="select-field"
              >
                <option value={OddsType.DECIMAL}>Decimal (2.00)</option>
                <option value={OddsType.AMERICAN}>American (+100)</option>
                <option value={OddsType.FRACTIONAL}>Fractional (1/1)</option>
                <option value={OddsType.IMPLIED}>Implied Probability (50%)</option>
              </select>
            </div>

            <InputField
              label="Odds"
              value={formData.odds}
              onChange={(value) => handleInputChange('odds', value)}
              error={errors.odds}
              type="text"
              placeholder={formData.oddsType === OddsType.FRACTIONAL ? "1/1" : "2.00"}
              icon={TrendingUp}
              tooltip="The odds for your bet in the selected format"
            />
          </div>

          {Object.keys(oddsPreview).length > 0 && (
            <div className="odds-preview">
              <h4>Odds Preview</h4>
              <div className="odds-grid">
                <div>Decimal: {oddsPreview.decimal}</div>
                <div>American: {oddsPreview.american}</div>
                <div>Fractional: {oddsPreview.fractional}</div>
                <div>Implied: {oddsPreview.implied}</div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="form-section">
          <h3>Advanced Options</h3>
          
          <InputField
            label="Bet Multiplier"
            value={formData.betMultiplier}
            onChange={(value) => handleInputChange('betMultiplier', value)}
            error={errors.betMultiplier}
            step="0.1"
            min="1.1"
            max="10"
            placeholder="2.0"
            tooltip="How much to multiply the bet after each loss (2.0 = double)"
          />

          <InputField
            label="Target Profit"
            value={formData.targetProfit}
            onChange={(value) => handleInputChange('targetProfit', value)}
            error={errors.targetProfit}
            step="0.01"
            min="0.01"
            placeholder="50.00"
            icon={DollarSign}
            tooltip="Stop when this profit is achieved"
            optional
          />

          <InputField
            label="Max Table Limit"
            value={formData.maxTableLimit}
            onChange={(value) => handleInputChange('maxTableLimit', value)}
            error={errors.maxTableLimit}
            step="0.01"
            min="0.01"
            placeholder="5000.00"
            icon={DollarSign}
            tooltip="Maximum bet allowed by the casino/platform"
            optional
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="calculate-button"
            disabled={loading}
          >
            {loading ? (
              <span>Calculating...</span>
            ) : (
              <>
                <Calculator size={20} />
                Calculate Progression
              </>
            )}
          </button>
        </div>
      </form>

      <div className="risk-notice">
        <AlertTriangle size={20} />
        <div>
          <strong>Risk Warning:</strong> The Martingale strategy involves significant risk. 
          Past performance does not guarantee future results. Only bet what you can afford to lose.
        </div>
      </div>
    </div>
  );
};

export default InputForm;