import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

const Charts = ({ results }) => {
  const [activeChart, setActiveChart] = useState('progression');

  if (!results || !results.progression) {
    return null;
  }

  const { progression, statistics, config } = results;

  // Prepare data for different chart types
  const progressionData = progression.map(round => ({
    round: round.round,
    betAmount: round.betAmount,
    cumulativeLoss: round.cumulativeLoss,
    totalWagered: round.totalWagered,
    netProfitIfWin: round.netProfitIfWin,
    remainingBankroll: round.remainingBankroll,
    bankrollPercentage: (round.remainingBankroll / config.bankroll) * 100
  }));

  const riskData = [
    {
      name: 'Win Probability',
      value: statistics.winProbabilityAtLeastOnce,
      color: '#10B981'
    },
    {
      name: 'Bust Risk',
      value: statistics.bustProbability,
      color: '#EF4444'
    }
  ];

  const outcomeData = progression.map((round, index) => {
    const winProbability = Math.pow(1 - config.winProbability / 100, index) * (config.winProbability / 100);
    const lossProbability = Math.pow(1 - config.winProbability / 100, index + 1);
    
    return {
      round: round.round,
      winProbability: winProbability * 100,
      cumulativeLossProbability: (1 - Math.pow(1 - config.winProbability / 100, index + 1)) * 100,
      profit: round.netProfitIfWin,
      loss: -round.totalWagered
    };
  });

  // Custom tooltip formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => `${value.toFixed(2)}%`;

  // Custom tooltips for different charts
  const ProgressionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`Round ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.name.includes('Percentage') ? formatPercentage(entry.value) : formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ProbabilityTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`Round ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatPercentage(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const charts = {
    progression: {
      title: 'Betting Progression',
      icon: TrendingUp,
      description: 'Shows how bet amounts and losses accumulate over rounds',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={progressionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="round" 
              label={{ value: 'Round', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<ProgressionTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="betAmount" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Bet Amount"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="cumulativeLoss" 
              stroke="#EF4444" 
              strokeWidth={2}
              name="Cumulative Loss"
              strokeDasharray="5 5"
            />
            <Line 
              type="monotone" 
              dataKey="totalWagered" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Total Wagered"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    bankroll: {
      title: 'Bankroll Depletion',
      icon: Activity,
      description: 'Shows how your bankroll decreases with each round',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={progressionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="round"
              label={{ value: 'Round', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: 'Bankroll (%)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              content={<ProgressionTooltip />}
              formatter={(value, name) => [
                name === 'bankrollPercentage' ? formatPercentage(value) : formatCurrency(value),
                name === 'bankrollPercentage' ? 'Remaining Bankroll' : name
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="bankrollPercentage"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.3}
              name="Remaining Bankroll"
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    outcomes: {
      title: 'Profit/Loss Outcomes',
      icon: BarChart3,
      description: 'Potential profit if winning at each round vs. loss if continuing',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={progressionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="round"
              label={{ value: 'Round', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<ProgressionTooltip />} />
            <Legend />
            <Bar 
              dataKey="netProfitIfWin" 
              fill="#10B981" 
              name="Profit If Win"
            />
            <Bar 
              dataKey="cumulativeLoss" 
              fill="#EF4444" 
              name="Loss So Far"
            />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    probability: {
      title: 'Win/Loss Probabilities',
      icon: PieChartIcon,
      description: 'Probability of winning vs. losing at each round',
      component: (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={outcomeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="round"
              label={{ value: 'Round', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<ProbabilityTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cumulativeLossProbability" 
              stroke="#EF4444" 
              strokeWidth={3}
              name="Cumulative Loss Probability"
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    risk: {
      title: 'Risk Overview',
      icon: PieChartIcon,
      description: 'Overall probability distribution of outcomes',
      component: (
        <div className="risk-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatPercentage(value)}`}
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatPercentage(value)} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="risk-metrics">
            <div className="risk-metric">
              <div className="metric-label">Expected Value</div>
              <div className={`metric-value ${statistics.expectedValue >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(statistics.expectedValue)}
              </div>
            </div>
            <div className="risk-metric">
              <div className="metric-label">Kelly Criterion</div>
              <div className="metric-value">
                {formatPercentage(statistics.kellyCriterion)}
              </div>
            </div>
            <div className="risk-metric">
              <div className="metric-label">Risk of Ruin</div>
              <div className="metric-value negative">
                {formatPercentage(statistics.riskOfRuin)}
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="charts-container">
      <div className="charts-header">
        <h3>Data Visualization</h3>
        <p>Interactive charts to analyze your Martingale strategy</p>
      </div>

      {/* Chart Navigation */}
      <div className="chart-nav">
        {Object.entries(charts).map(([key, chart]) => {
          const IconComponent = chart.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveChart(key)}
              className={`chart-nav-button ${activeChart === key ? 'active' : ''}`}
            >
              <IconComponent size={18} />
              {chart.title}
            </button>
          );
        })}
      </div>

      {/* Active Chart */}
      <div className="chart-content">
        <div className="chart-info">
          <h4>{charts[activeChart].title}</h4>
          <p>{charts[activeChart].description}</p>
        </div>
        
        <div className="chart-wrapper">
          {charts[activeChart].component}
        </div>
      </div>

      {/* Chart Insights */}
      <div className="chart-insights">
        <h4>Key Insights</h4>
        <div className="insights-grid">
          {activeChart === 'progression' && (
            <>
              <div className="insight">
                <strong>Exponential Growth:</strong> Notice how bet amounts grow exponentially, 
                requiring increasingly larger bets to recover losses.
              </div>
              <div className="insight">
                <strong>Total Risk:</strong> The total wagered amount shows your maximum exposure 
                if you lose all rounds.
              </div>
            </>
          )}
          
          {activeChart === 'bankroll' && (
            <>
              <div className="insight">
                <strong>Rapid Depletion:</strong> Your bankroll decreases quickly with each loss, 
                limiting the number of rounds you can play.
              </div>
              <div className="insight">
                <strong>Critical Point:</strong> When the area reaches near zero, you can no longer 
                continue the strategy.
              </div>
            </>
          )}
          
          {activeChart === 'outcomes' && (
            <>
              <div className="insight">
                <strong>Diminishing Returns:</strong> While potential profit stays relatively stable, 
                losses accumulate rapidly.
              </div>
              <div className="insight">
                <strong>Risk/Reward:</strong> Compare the green (profit) vs red (loss) bars to 
                understand the risk-reward ratio.
              </div>
            </>
          )}
          
          {activeChart === 'probability' && (
            <>
              <div className="insight">
                <strong>Increasing Risk:</strong> The probability of losing all rounds increases 
                with each additional round.
              </div>
              <div className="insight">
                <strong>Time Decay:</strong> The longer you play, the higher the chance of 
                experiencing a devastating losing streak.
              </div>
            </>
          )}
          
          {activeChart === 'risk' && (
            <>
              <div className="insight">
                <strong>Overall Odds:</strong> The pie chart shows your overall probability 
                of success vs. failure for this session.
              </div>
              <div className="insight">
                <strong>Expected Value:</strong> {statistics.expectedValue >= 0 
                  ? 'Positive expected value suggests a profitable strategy.' 
                  : 'Negative expected value indicates long-term losses are likely.'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;