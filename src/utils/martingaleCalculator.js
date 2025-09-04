import { convertToDecimal, calculatePayout, decimalToImpliedProbability } from './oddsConverter.js';

/**
 * Calculate Martingale betting progression
 * @param {object} config - Configuration object
 * @returns {object} Calculation results
 */
export const calculateMartingaleProgression = (config) => {
  // Validate config
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid configuration object');
  }

  const {
    baseBet,
    bankroll,
    odds,
    oddsType,
    maxRounds = 20,
    targetProfit = null,
    betMultiplier = 2,
    maxTableLimit = null
  } = config;

  // Validate required inputs
  if (typeof baseBet !== 'number' || baseBet <= 0 || !isFinite(baseBet)) {
    throw new Error('Base bet must be a positive number');
  }
  if (typeof bankroll !== 'number' || bankroll <= 0 || !isFinite(bankroll)) {
    throw new Error('Bankroll must be a positive number');
  }
  if (typeof odds !== 'number' && typeof odds !== 'string') {
    throw new Error('Odds must be a number or string');
  }
  if (!oddsType || !['decimal', 'american', 'fractional', 'implied'].includes(oddsType)) {
    throw new Error('Invalid odds type');
  }

  // Convert odds to decimal format with validation
  const decimalOdds = convertToDecimal(odds, oddsType);
  if (decimalOdds <= 1.00) {
    throw new Error('Invalid odds - must be greater than 1.00');
  }

  const winProbability = decimalToImpliedProbability(decimalOdds) / 100;
  const lossProbability = 1 - winProbability;

  // Validate probabilities
  if (!isFinite(winProbability) || winProbability <= 0 || winProbability >= 1) {
    throw new Error('Invalid probability calculation');
  }

  const progression = [];
  let currentBet = baseBet;
  let totalLoss = 0;
  let totalWagered = 0;
  let round = 1;
  let remainingBankroll = bankroll;

  // Calculate progression until win, bankroll depletion, or max rounds
  while (round <= maxRounds) {
    // Check if bet exceeds remaining bankroll
    if (currentBet > remainingBankroll) {
      break;
    }

    // Check table limit
    if (maxTableLimit && currentBet > maxTableLimit) {
      break;
    }

    const payout = calculatePayout(currentBet, decimalOdds);
    totalWagered += currentBet;
    totalLoss += currentBet;
    remainingBankroll -= currentBet;

    // If we win this round
    const netProfitIfWin = payout.profit - (totalLoss - currentBet);
    const totalReturnIfWin = payout.totalReturn;

    progression.push({
      round,
      betAmount: currentBet,
      cumulativeLoss: totalLoss - currentBet, // Loss before this bet
      totalWagered: totalWagered,
      potentialWin: payout.profit,
      netProfitIfWin,
      totalReturnIfWin,
      remainingBankroll: remainingBankroll,
      breakeven: netProfitIfWin >= 0,
      targetMet: targetProfit ? netProfitIfWin >= targetProfit : netProfitIfWin > 0
    });

    // If we achieve target profit, we can stop
    if (targetProfit && netProfitIfWin >= targetProfit) {
      break;
    }

    // Prepare next round
    currentBet *= betMultiplier;
    round++;
  }

  // Calculate statistics
  const statistics = calculateStatistics({
    progression,
    winProbability,
    lossProbability,
    bankroll,
    baseBet,
    decimalOdds,
    maxRounds
  });

  return {
    progression,
    statistics,
    config: {
      ...config,
      decimalOdds,
      winProbability: winProbability * 100,
      lossProbability: lossProbability * 100
    }
  };
};

/**
 * Calculate various statistics and risk metrics
 */
const calculateStatistics = ({
  progression,
  winProbability,
  lossProbability,
  bankroll,
  baseBet,
  decimalOdds,
  maxRounds
}) => {
  const lastRound = progression[progression.length - 1];
  const maxPossibleRounds = progression.length;
  
  // Probability of losing all rounds (going bust)
  const bustProbability = Math.pow(lossProbability, maxPossibleRounds);
  
  // Probability of winning at least once
  const winProbabilityAtLeastOnce = 1 - bustProbability;
  
  // Expected value calculation with validation
  let expectedValue = 0;
  for (let i = 0; i < maxPossibleRounds; i++) {
    const roundData = progression[i];
    if (roundData && typeof roundData.netProfitIfWin === 'number' && !isNaN(roundData.netProfitIfWin)) {
      const winOnThisRound = Math.pow(lossProbability, i) * winProbability;
      expectedValue += winOnThisRound * roundData.netProfitIfWin;
    }
  }
  
  // If we lose all rounds
  if (lastRound && typeof lastRound.totalWagered === 'number' && !isNaN(lastRound.totalWagered)) {
    const loseAllRounds = bustProbability * (-lastRound.totalWagered);
    expectedValue += loseAllRounds;
  }
  
  // Ensure expectedValue is a valid number
  if (!isFinite(expectedValue)) {
    expectedValue = 0;
  }
  
  // Risk of ruin calculation
  const riskOfRuin = calculateRiskOfRuin(bankroll, baseBet, winProbability);
  
  // Maximum drawdown
  const maxDrawdown = lastRound ? lastRound.totalWagered : 0;
  
  // Kelly Criterion for optimal bet sizing
  const kellyCriterion = calculateKellyCriterion(decimalOdds, winProbability);
  
  return {
    maxPossibleRounds,
    bustProbability: bustProbability * 100,
    winProbabilityAtLeastOnce: winProbabilityAtLeastOnce * 100,
    expectedValue,
    riskOfRuin: riskOfRuin * 100,
    maxDrawdown,
    kellyCriterion: kellyCriterion * 100,
    recommendedBankroll: baseBet * 20, // Conservative recommendation
    averageProfit: lastRound ? lastRound.netProfitIfWin : 0,
    worstCaseScenario: lastRound ? -lastRound.totalWagered : 0
  };
};

/**
 * Calculate risk of ruin using the gambler's ruin formula
 */
const calculateRiskOfRuin = (bankroll, unitSize, winProbability) => {
  // Validate inputs
  if (bankroll <= 0 || unitSize <= 0 || winProbability <= 0 || winProbability >= 1) {
    return 1; // Invalid inputs, assume certain ruin
  }
  
  const units = Math.floor(bankroll / unitSize);
  const lossProbability = 1 - winProbability;
  
  if (winProbability === 0.5) {
    return 1; // Certain ruin in fair game
  }
  
  const q_p = lossProbability / winProbability;
  
  if (q_p === 1) {
    return 1;
  }
  
  // Ensure we don't get NaN or infinite values
  if (!isFinite(q_p) || q_p <= 0) {
    return 1;
  }
  
  const risk = Math.pow(q_p, units);
  return Math.min(Math.max(risk, 0), 1); // Clamp between 0 and 1
};

/**
 * Calculate Kelly Criterion for optimal bet sizing
 */
const calculateKellyCriterion = (decimalOdds, winProbability) => {
  // Validate inputs
  if (decimalOdds <= 1 || winProbability <= 0 || winProbability >= 1) {
    return 0; // Invalid inputs, don't bet
  }
  
  const b = decimalOdds - 1; // Net odds
  const p = winProbability;
  const q = 1 - winProbability;
  
  const kelly = (b * p - q) / b;
  
  // Ensure valid result
  if (!isFinite(kelly) || isNaN(kelly)) {
    return 0;
  }
  
  return Math.max(0, Math.min(kelly, 1)); // Don't bet if Kelly is negative, clamp to max 100%
};

/**
 * Simulate multiple Martingale sessions with random outcomes
 */
export const simulateMartingaleSessions = (config, numSessions = 1000) => {
  // Validate inputs
  if (typeof numSessions !== 'number' || numSessions <= 0 || numSessions > 100000 || !isFinite(numSessions)) {
    throw new Error('Number of sessions must be between 1 and 100,000');
  }

  const results = [];
  const progressionResults = calculateMartingaleProgression(config);
  const decimalOdds = progressionResults.config.decimalOdds;
  const winProbability = decimalToImpliedProbability(decimalOdds) / 100;
  
  // Validate win probability (allow very small probabilities for extreme odds)
  if (!isFinite(winProbability) || winProbability <= 0 || winProbability > 1) {
    throw new Error('Invalid win probability for simulation');
  }
  
  for (let session = 0; session < numSessions; session++) {
    const sessionResult = simulateSingleSession(config, winProbability);
    results.push(sessionResult);
  }
  
  // Calculate simulation statistics
  const profits = results.map(r => r.profit);
  const wins = results.filter(r => r.won).length;
  const losses = results.filter(r => !r.won).length;
  
  return {
    results,
    summary: {
      totalSessions: numSessions,
      wins,
      losses,
      winRate: (wins / numSessions) * 100,
      averageProfit: profits.reduce((a, b) => a + b, 0) / numSessions,
      maxProfit: Math.max(...profits),
      maxLoss: Math.min(...profits),
      profitableSessions: results.filter(r => r.profit > 0).length
    }
  };
};

/**
 * Simulate a single Martingale session
 */
const simulateSingleSession = (config, winProbability) => {
  const progression = calculateMartingaleProgression(config).progression;
  
  for (let i = 0; i < progression.length; i++) {
    const random = Math.random();
    if (random < winProbability) {
      // Win on this round
      return {
        won: true,
        roundsPlayed: i + 1,
        profit: progression[i].netProfitIfWin,
        totalWagered: progression[i].totalWagered
      };
    }
  }
  
  // Lost all rounds
  const lastRound = progression[progression.length - 1];
  return {
    won: false,
    roundsPlayed: progression.length,
    profit: -lastRound.totalWagered,
    totalWagered: lastRound.totalWagered
  };
};

/**
 * Generate risk warnings based on configuration
 */
export const generateRiskWarnings = (config, statistics) => {
  const warnings = [];
  
  // High bust probability
  if (statistics.bustProbability > 10) {
    warnings.push({
      type: 'high-risk',
      message: `High risk of losing entire bankroll: ${statistics.bustProbability.toFixed(1)}%`
    });
  }
  
  // Insufficient bankroll
  if (config.bankroll < statistics.recommendedBankroll) {
    warnings.push({
      type: 'bankroll',
      message: `Recommended bankroll: $${statistics.recommendedBankroll.toFixed(2)} (you have $${config.bankroll.toFixed(2)})`
    });
  }
  
  // Negative expected value
  if (statistics.expectedValue < 0) {
    warnings.push({
      type: 'negative-ev',
      message: `Negative expected value: $${statistics.expectedValue.toFixed(2)} per session`
    });
  }
  
  // Kelly criterion warning
  if (statistics.kellyCriterion === 0) {
    warnings.push({
      type: 'kelly',
      message: 'Kelly criterion suggests not betting - unfavorable odds'
    });
  }
  
  // Large bet progression
  const progression = calculateMartingaleProgression(config).progression;
  const maxBet = Math.max(...progression.map(r => r.betAmount));
  if (maxBet > config.bankroll * 0.5) {
    warnings.push({
      type: 'large-bet',
      message: `Maximum bet (${maxBet.toFixed(2)}) exceeds 50% of bankroll`
    });
  }
  
  return warnings;
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (progression, statistics) => {
  const headers = [
    'Round',
    'Bet Amount',
    'Cumulative Loss',
    'Total Wagered', 
    'Potential Win',
    'Net Profit If Win',
    'Remaining Bankroll'
  ];
  
  const rows = progression.map(round => [
    round.round,
    round.betAmount.toFixed(2),
    round.cumulativeLoss.toFixed(2),
    round.totalWagered.toFixed(2),
    round.potentialWin.toFixed(2),
    round.netProfitIfWin.toFixed(2),
    round.remainingBankroll.toFixed(2)
  ]);
  
  let csv = headers.join(',') + '\n';
  csv += rows.map(row => row.join(',')).join('\n');
  
  // Add statistics summary
  csv += '\n\nStatistics\n';
  csv += `Expected Value,${statistics.expectedValue.toFixed(2)}\n`;
  csv += `Bust Probability,${statistics.bustProbability.toFixed(2)}%\n`;
  csv += `Max Drawdown,${statistics.maxDrawdown.toFixed(2)}\n`;
  csv += `Kelly Criterion,${statistics.kellyCriterion.toFixed(2)}%\n`;
  
  return csv;
};