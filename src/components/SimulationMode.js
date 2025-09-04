
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { simulateMartingaleSessions } from '../utils/martingaleCalculator';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Histogram
} from 'recharts';

const SimulationMode = ({ config }) => {
  const [simulationResults, setSimulationResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [numSessions, setNumSessions] = useState(1000);
  const [currentSession, setCurrentSession] = useState(0);
  const [liveResults, setLiveResults] = useState([]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  const runSimulation = async () => {
    if (!config) return;

    setIsRunning(true);
    setProgress(0);
    setCurrentSession(0);
    setLiveResults([]);

    try {
      // Run simulation in chunks to show progress
      const chunkSize = 100;
      const totalChunks = Math.ceil(numSessions / chunkSize);
      let allResults = [];

      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const sessionsInThisChunk = Math.min(chunkSize, numSessions - chunk * chunkSize);
        
        try {
          const chunkResults = simulateMartingaleSessions(config, sessionsInThisChunk);
          
          // Make sure we're getting the actual results array
          const resultsArray = chunkResults.results || [];
          allResults = allResults.concat(resultsArray);
          
          // Update progress
          const completedSessions = (chunk + 1) * chunkSize;
          setProgress((completedSessions / numSessions) * 100);
          setCurrentSession(Math.min(completedSessions, numSessions));

          // Update live results for real-time feedback
          const cumulativeResults = {
            results: allResults,
            summary: calculateCumulativeSummary(allResults)
          };
          setLiveResults(cumulativeResults);

          // Small delay to show progress (remove in production for faster execution)
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (chunkError) {
          console.error('Error in simulation chunk:', chunkError);
          // Continue with next chunk, but log the error
        }
      }

      // Final results
      const finalResults = {
        results: allResults,
        summary: calculateCumulativeSummary(allResults)
      };

      setSimulationResults(finalResults);
    } catch (error) {
      console.error('Simulation error:', error);
      // Show error to user
      alert(`Simulation error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const calculateCumulativeSummary = (results) => {
    if (!results || results.length === 0) return null;

    // Validate and extract profits safely
    const profits = results.map(r => {
      if (r && typeof r.profit === 'number' && !isNaN(r.profit)) {
        return r.profit;
      }
      return 0; // Default to 0 for invalid values
    });

    const wins = results.filter(r => r && r.won === true).length;
    const losses = results.filter(r => r && r.won === false).length;

    // Calculate average profit safely
    const totalProfit = profits.reduce((a, b) => a + b, 0);
    const averageProfit = results.length > 0 ? totalProfit / results.length : 0;

    // Calculate max and min safely
    const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
    const maxLoss = profits.length > 0 ? Math.min(...profits) : 0;

    return {
      totalSessions: results.length,
      wins,
      losses,
      winRate: results.length > 0 ? (wins / results.length) * 100 : 0,
      averageProfit,
      maxProfit,
      maxLoss,
      profitableSessions: profits.filter(p => p > 0).length,
      medianProfit: calculateMedian(profits),
      standardDeviation: calculateStandardDeviation(profits)
    };
  };

  const calculateMedian = (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    
    // Filter out non-numeric values
    const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
    if (validNumbers.length === 0) return 0;
    
    const sorted = [...validNumbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  };

  const calculateStandardDeviation = (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    
    // Filter out non-numeric values
    const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
    if (validNumbers.length === 0) return 0;
    
    const mean = validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length;
    const squaredDiffs = validNumbers.map(num => Math.pow(num - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / validNumbers.length;
    
    // Ensure we don't take square root of negative number
    return avgSquaredDiff >= 0 ? Math.sqrt(avgSquaredDiff) : 0;
  };

  const resetSimulation = () => {
    setSimulationResults(null);
    setLiveResults([]);
    setProgress(0);
    setCurrentSession(0);
  };

  // Prepare chart data
  const getDistributionData = (results) => {
    if (!results || results.length === 0) return [];

    // Safely extract profits with validation
    const profits = results.map(r => {
      if (r && typeof r.profit === 'number' && !isNaN(r.profit)) {
        return r.profit;
      }
      return 0; // Default to 0 for invalid values
    });
    
    // Handle case where all profits are the same or invalid
    if (profits.length === 0) return [];
    
    const min = Math.min(...profits);
    const max = Math.max(...profits);
    
    // Handle edge case where min and max are the same
    if (min === max) {
      return [{
        range: formatCurrency(min),
        count: profits.length,
        midpoint: min
      }];
    }

    // Ensure we have valid bucket calculations
    const buckets = Math.min(20, Math.max(5, Math.floor(Math.sqrt(profits.length))));
    const bucketSize = (max - min) / buckets;

    // Prevent division by zero or invalid bucket sizes
    if (bucketSize <= 0 || !isFinite(bucketSize)) {
      return [{
        range: formatCurrency(min),
        count: profits.length,
        midpoint: min
      }];
    }

    const distribution = Array(buckets).fill(0).map((_, i) => ({
      range: `${formatCurrency(min + i * bucketSize)} to ${formatCurrency(min + (i + 1) * bucketSize)}`,
      count: 0,
      midpoint: min + (i + 0.5) * bucketSize
    }));

    profits.forEach(profit => {
      const bucketIndex = Math.min(Math.floor((profit - min) / bucketSize), buckets - 1);
      if (distribution[bucketIndex]) {
        distribution[bucketIndex].count++;
      }
    });

    return distribution;
  };

  const getRunningAverageData = (results) => {
    if (!results || results.length === 0) return [];

    let runningSum = 0;
    return results.map((result, index) => {
      runningSum += result.profit;
      return {
        session: index + 1,
        runningAverage: runningSum / (index + 1),
        profit: result.profit
      };
    });
  };

  const displayResults = simulationResults || liveResults;

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h3>Monte Carlo Simulation</h3>
        <p>Run thousands of simulated sessions to analyze the long-term performance of your Martingale strategy</p>
      </div>

      {!config && (
        <div className="simulation-notice">
          <p>Please configure your Martingale strategy parameters first to run simulations.</p>
        </div>
      )}

      {config && (
        <>
          {/* Simulation Controls */}
          <div className="simulation-controls">
            <div className="control-group">
              <label>Number of Sessions</label>
              <select
                value={numSessions}
                onChange={(e) => setNumSessions(parseInt(e.target.value))}
                disabled={isRunning}
                className="select-field"
              >
                <option value={100}>100 Sessions</option>
                <option value={500}>500 Sessions</option>
                <option value={1000}>1,000 Sessions</option>
                <option value={5000}>5,000 Sessions</option>
                <option value={10000}>10,000 Sessions</option>
              </select>
            </div>

            <div className="control-actions">
              <button
                onClick={runSimulation}
                disabled={isRunning}
                className="action-button primary"
              >
                <Play size={16} />
                {isRunning ? 'Running...' : 'Start Simulation'}
              </button>

              <button
                onClick={resetSimulation}
                disabled={isRunning}
                className="action-button secondary"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="simulation-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p>Simulating session {currentSession} of {numSessions} ({progress.toFixed(0)}%)</p>
            </div>
          )}

          {/* Live/Final Results */}
          {displayResults && displayResults.summary && (
            <>
              {/* Summary Statistics */}
              <div className="simulation-summary">
                <h4>
                  {isRunning ? 'Live Results' : 'Final Results'} 
                  ({displayResults.summary.totalSessions.toLocaleString()} sessions)
                </h4>
                
                <div className="stats-grid">
                  <div className="stat-card success">
                    <div className="stat-icon">
                      <TrendingUp />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatPercentage(displayResults.summary.winRate)}</div>
                      <div className="stat-label">Win Rate</div>
                      <div className="stat-detail">{displayResults.summary.wins.toLocaleString()} wins</div>
                    </div>
                  </div>

                  <div className="stat-card danger">
                    <div className="stat-icon">
                      <TrendingDown />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatPercentage(100 - displayResults.summary.winRate)}</div>
                      <div className="stat-label">Loss Rate</div>
                      <div className="stat-detail">{displayResults.summary.losses.toLocaleString()} losses</div>
                    </div>
                  </div>

                  <div className="stat-card neutral">
                    <div className="stat-icon">
                      <Target />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatCurrency(displayResults.summary.averageProfit)}</div>
                      <div className="stat-label">Average Profit</div>
                      <div className="stat-detail">per session</div>
                    </div>
                  </div>

                  <div className="stat-card warning">
                    <div className="stat-icon">
                      <BarChart3 />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{formatCurrency(displayResults.summary.maxLoss)}</div>
                      <div className="stat-label">Worst Loss</div>
                      <div className="stat-detail">maximum drawdown</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div className="detailed-simulation-stats">
                <h4>Detailed Statistics</h4>
                <div className="stats-table">
                  <div className="stat-row">
                    <span>Best Result:</span>
                    <span className="positive">{formatCurrency(displayResults.summary.maxProfit)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Worst Result:</span>
                    <span className="negative">{formatCurrency(displayResults.summary.maxLoss)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Median Result:</span>
                    <span>{formatCurrency(displayResults.summary.medianProfit)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Standard Deviation:</span>
                    <span>{formatCurrency(displayResults.summary.standardDeviation)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Profitable Sessions:</span>
                    <span>{displayResults.summary.profitableSessions.toLocaleString()} ({formatPercentage((displayResults.summary.profitableSessions / displayResults.summary.totalSessions) * 100)})</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="simulation-charts">
                {/* Profit Distribution */}
                <div className="chart-section">
                  <h4>Profit Distribution</h4>
                  <p>Shows how often different profit/loss amounts occur</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getDistributionData(displayResults.results)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="midpoint"
                        tickFormatter={formatCurrency}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Sessions']}
                        labelFormatter={(value) => `Range: ${formatCurrency(value - 50)} to ${formatCurrency(value + 50)}`}
                      />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Running Average */}
                <div className="chart-section">
                  <h4>Running Average Profit</h4>
                  <p>Shows how the average profit per session evolves over time</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getRunningAverageData(displayResults.results.slice(0, 1000))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="session"
                        label={{ value: 'Session Number', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Average Profit ($)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name === 'runningAverage' ? 'Running Average' : 'Session Profit']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="runningAverage" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Running Average"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div className="simulation-insights">
                <h4>Simulation Insights</h4>
                <div className="insights-grid">
                  <div className="insight">
                    <strong>Law of Large Numbers:</strong> As you run more sessions, the average result 
                    converges toward the theoretical expected value.
                  </div>
                  <div className="insight">
                    <strong>Variance Impact:</strong> Notice the wide distribution of outcomes - 
                    individual sessions can vary dramatically from the average.
                  </div>
                  <div className="insight">
                    <strong>Risk Assessment:</strong> The worst-case scenarios show the maximum 
                    potential loss you could face in a single session.
                  </div>
                  <div className="insight">
                    <strong>Win Rate Reality:</strong> A high win rate doesn't guarantee profitability
                    if the occasional losses are much larger than the frequent wins.
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SimulationMode;