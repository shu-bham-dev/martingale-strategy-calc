// Odds conversion utilities for different betting formats

export const OddsType = {
  DECIMAL: 'decimal',
  AMERICAN: 'american',
  FRACTIONAL: 'fractional',
  IMPLIED: 'implied'
};

/**
 * Convert decimal odds to American odds
 * @param {number} decimal - Decimal odds (e.g., 2.5)
 * @returns {number} American odds
 */
export const decimalToAmerican = (decimal) => {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
};

/**
 * Convert American odds to decimal odds
 * @param {number} american - American odds (e.g., +150 or -200)
 * @returns {number} Decimal odds
 */
export const americanToDecimal = (american) => {
  try {
    // Handle string inputs like "+150" or "-200"
    const num = typeof american === 'string' ? parseInt(american.replace('+', '')) : american;
    
    if (num > 0) {
      const result = (num / 100) + 1;
      return Math.max(result, 1.01); // Ensure minimum valid odds
    } else if (num < 0) {
      const absNum = Math.abs(num);
      if (absNum < 100) {
        return 1.01; // Minimum valid odds for negative American odds
      }
      const result = (100 / absNum) + 1;
      return Math.max(result, 1.01); // Ensure minimum valid odds
    } else {
      return 1.01; // Invalid input, return minimum
    }
  } catch (error) {
    return 1.01; // Fallback to minimum valid odds
  }
};

/**
 * Convert fractional odds to decimal odds
 * @param {string} fractional - Fractional odds (e.g., "3/2" or "2/1")
 * @returns {number} Decimal odds
 */
export const fractionalToDecimal = (fractional) => {
  try {
    const [numerator, denominator] = fractional.split('/').map(Number);
    
    // Validate inputs
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      return 1.01; // Minimum valid odds
    }
    
    const result = (numerator / denominator) + 1;
    
    // Ensure valid result
    if (!isFinite(result) || result < 1.01) {
      return 1.01;
    }
    
    return result;
  } catch (error) {
    return 1.01; // Fallback to minimum valid odds
  }
};

/**
 * Convert decimal odds to fractional odds
 * @param {number} decimal - Decimal odds
 * @returns {string} Fractional odds
 */
export const decimalToFractional = (decimal) => {
  const fraction = decimal - 1;
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  
  let numerator = Math.round(fraction * 100);
  let denominator = 100;
  
  const divisor = gcd(numerator, denominator);
  numerator /= divisor;
  denominator /= divisor;
  
  return `${numerator}/${denominator}`;
};

/**
 * Calculate implied probability from decimal odds
 * @param {number} decimal - Decimal odds
 * @returns {number} Implied probability as percentage
 */
export const decimalToImpliedProbability = (decimal) => {
  if (decimal < 1.01 || !isFinite(decimal)) {
    return 0; // Invalid odds, return 0 probability
  }
  return (1 / decimal) * 100;
};

/**
 * Convert implied probability to decimal odds
 * @param {number} probability - Probability as percentage
 * @returns {number} Decimal odds
 */
export const impliedProbabilityToDecimal = (probability) => {
  if (probability <= 0 || probability >= 100 || !isFinite(probability)) {
    return 1.01; // Invalid probability, return minimum valid odds
  }
  return 100 / probability;
};

/**
 * Convert any odds format to decimal
 * @param {string|number} odds - The odds value
 * @param {string} type - The type of odds (decimal, american, fractional, implied)
 * @returns {number} Decimal odds
 */
export const convertToDecimal = (odds, type) => {
  try {
    let result;
    switch (type) {
      case OddsType.DECIMAL:
        result = parseFloat(odds);
        break;
      case OddsType.AMERICAN:
        result = americanToDecimal(parseInt(odds));
        break;
      case OddsType.FRACTIONAL:
        result = fractionalToDecimal(odds);
        break;
      case OddsType.IMPLIED:
        result = impliedProbabilityToDecimal(parseFloat(odds));
        break;
      default:
        result = parseFloat(odds);
    }
    
    // Validate result
    if (!isFinite(result) || result < 1.01) {
      return 1.01; // Minimum valid decimal odds
    }
    return result;
  } catch (error) {
    return 1.01; // Fallback to minimum valid odds
  }
};

/**
 * Format odds for display
 * @param {number} decimal - Decimal odds
 * @param {string} targetType - Target format type
 * @returns {string} Formatted odds
 */
export const formatOdds = (decimal, targetType) => {
  switch (targetType) {
    case OddsType.DECIMAL:
      return decimal.toFixed(2);
    case OddsType.AMERICAN:
      const american = decimalToAmerican(decimal);
      return american > 0 ? `+${american}` : `${american}`;
    case OddsType.FRACTIONAL:
      return decimalToFractional(decimal);
    case OddsType.IMPLIED:
      return `${decimalToImpliedProbability(decimal).toFixed(1)}%`;
    default:
      return decimal.toFixed(2);
  }
};

/**
 * Calculate payout from odds and stake
 * @param {number} stake - Bet amount
 * @param {number} decimalOdds - Decimal odds
 * @returns {object} Payout details
 */
export const calculatePayout = (stake, decimalOdds) => {
  const totalReturn = stake * decimalOdds;
  const profit = totalReturn - stake;
  
  return {
    stake,
    profit,
    totalReturn,
    odds: decimalOdds
  };
};

/**
 * Validate odds input
 * @param {string} odds - Odds input
 * @param {string} type - Odds type
 * @returns {object} Validation result
 */
export const validateOdds = (odds, type) => {
  const errors = [];
  
  if (!odds || odds.trim() === '') {
    errors.push('Odds cannot be empty');
    return { isValid: false, errors };
  }
  
  switch (type) {
    case OddsType.DECIMAL:
      const decimal = parseFloat(odds);
      if (isNaN(decimal) || decimal <= 1) {
        errors.push('Decimal odds must be greater than 1.00');
      }
      break;
      
    case OddsType.AMERICAN:
      const american = parseInt(odds);
      if (isNaN(american) || american === 0 || (american > -100 && american < 100)) {
        errors.push('American odds must be ≥ +100 or ≤ -100');
      }
      break;
      
    case OddsType.FRACTIONAL:
      if (!/^\d+\/\d+$/.test(odds)) {
        errors.push('Fractional odds must be in format "3/2"');
      } else {
        const [num, den] = odds.split('/').map(Number);
        if (num <= 0 || den <= 0) {
          errors.push('Fractional odds must have positive numbers');
        }
      }
      break;
      
    case OddsType.IMPLIED:
      const probability = parseFloat(odds);
      if (isNaN(probability) || probability <= 0 || probability >= 100) {
        errors.push('Implied probability must be between 0% and 100%');
      }
      break;
      
    default:
      errors.push('Invalid odds type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};