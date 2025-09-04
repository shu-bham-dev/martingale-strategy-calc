import React, { useState } from 'react';
import { Download, Copy, AlertTriangle, TrendingDown, TrendingUp, Target, Info } from 'lucide-react';
import { exportToCSV } from '../utils/martingaleCalculator';

const ResultsTable = ({ results, onExport, onCopy }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'round', direction: 'asc' });
  const [showAllRounds, setShowAllRounds] = useState(false);

  if (!results || !results.progression) {
    return null;
  }

  const { progression, statistics, config } = results;
  const displayRounds = showAllRounds ? progression : progression.slice(0, 10);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProgression = [...displayRounds].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(progression, statistics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'martingale-progression.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    if (onExport) onExport();
  };

  const handleCopyTable = () => {
    const headers = ['Round', 'Bet Amount', 'Cumulative Loss', 'Total Wagered', 'Net Profit If Win', 'Remaining Bankroll'];
    const rows = progression.map(round => [
      round.round,
      formatCurrency(round.betAmount),
      formatCurrency(round.cumulativeLoss),
      formatCurrency(round.totalWagered),
      formatCurrency(round.netProfitIfWin),
      formatCurrency(round.remainingBankroll)
    ]);

    let text = headers.join('\t') + '\n';
    text += rows.map(row => row.join('\t')).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      if (onCopy) onCopy();
    });
  };

  return (
    <div className="results-container">
      {/* Configuration Summary */}
      <div className="config-summary">
        <h3>Configuration Summary</h3>
        <div className="config-grid">
          <div className="config-item">
            <strong>Base Bet:</strong> {formatCurrency(config.baseBet)}
          </div>
          <div className="config-item">
            <strong>Bankroll:</strong> {formatCurrency(config.bankroll)}
          </div>
          <div className="config-item">
            <strong>Odds:</strong> {config.decimalOdds.toFixed(2)} 
            <span className="odds-detail">({formatPercentage(config.winProbability)} win chance)</span>
          </div>
          <div className="config-item">
            <strong>Multiplier:</strong> {config.betMultiplier}x
          </div>
          {config.targetProfit && (
            <div className="config-item">
              <strong>Target Profit:</strong> {formatCurrency(config.targetProfit)}
            </div>
          )}
          {config.maxTableLimit && (
            <div className="config-item">
              <strong>Table Limit:</strong> {formatCurrency(config.maxTableLimit)}
            </div>
          )}
        </div>
      </div>

      {/* Key Statistics */}
      <div className="statistics-grid">
        <div className="stat-card success">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatPercentage(statistics.winProbabilityAtLeastOnce)}</div>
            <div className="stat-label">Success Probability</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <TrendingDown />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatPercentage(statistics.bustProbability)}</div>
            <div className="stat-label">Bust Risk</div>
          </div>
        </div>

        <div className="stat-card neutral">
          <div className="stat-icon">
            <Target />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(statistics.expectedValue)}</div>
            <div className="stat-label">Expected Value</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(statistics.maxDrawdown)}</div>
            <div className="stat-label">Max Drawdown</div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <h3>Detailed Analysis</h3>
        <div className="stats-grid">
          <div className="stat-row">
            <span className="stat-name">
              Kelly Criterion
              <div className="tooltip">
                <Info size={14} />
                <span className="tooltip-text">Optimal bet size as percentage of bankroll</span>
              </div>
            </span>
            <span className="stat-value">{formatPercentage(statistics.kellyCriterion)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-name">
              Risk of Ruin
              <div className="tooltip">
                <Info size={14} />
                <span className="tooltip-text">Probability of losing entire bankroll</span>
              </div>
            </span>
            <span className="stat-value">{formatPercentage(statistics.riskOfRuin)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-name">Recommended Bankroll</span>
            <span className="stat-value">{formatCurrency(statistics.recommendedBankroll)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-name">Average Profit (if win)</span>
            <span className="stat-value">{formatCurrency(statistics.averageProfit)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-name">Worst Case Scenario</span>
            <span className="stat-value text-danger">{formatCurrency(statistics.worstCaseScenario)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-name">Max Possible Rounds</span>
            <span className="stat-value">{statistics.maxPossibleRounds}</span>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="table-controls">
        <div className="controls-left">
          <h3>Betting Progression Table</h3>
          <p>Round-by-round breakdown of the Martingale strategy</p>
        </div>
        <div className="controls-right">
          <button onClick={() => setShowAllRounds(!showAllRounds)} className="toggle-button">
            {showAllRounds ? `Show First 10` : `Show All ${progression.length} Rounds`}
          </button>
          <button onClick={handleCopyTable} className="action-button">
            <Copy size={16} />
            Copy Table
          </button>
          <button onClick={handleExportCSV} className="action-button">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Progression Table */}
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('round')} className="sortable">
                Round {getSortIcon('round')}
              </th>
              <th onClick={() => handleSort('betAmount')} className="sortable">
                Bet Amount {getSortIcon('betAmount')}
              </th>
              <th onClick={() => handleSort('cumulativeLoss')} className="sortable">
                Loss So Far {getSortIcon('cumulativeLoss')}
              </th>
              <th onClick={() => handleSort('totalWagered')} className="sortable">
                Total Spent {getSortIcon('totalWagered')}
              </th>
              <th onClick={() => handleSort('netProfitIfWin')} className="sortable">
                Net Profit If Win {getSortIcon('netProfitIfWin')}
              </th>
              <th onClick={() => handleSort('remainingBankroll')} className="sortable">
                Remaining Bankroll {getSortIcon('remainingBankroll')}
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedProgression.map((round, index) => (
              <tr key={round.round} className={`${round.targetMet ? 'target-met' : ''} ${round.remainingBankroll < round.betAmount * config.betMultiplier ? 'danger-zone' : ''}`}>
                <td className="round-number">{round.round}</td>
                <td className="currency">{formatCurrency(round.betAmount)}</td>
                <td className="currency loss">{formatCurrency(round.cumulativeLoss)}</td>
                <td className="currency">{formatCurrency(round.totalWagered)}</td>
                <td className={`currency ${round.netProfitIfWin >= 0 ? 'profit' : 'loss'}`}>
                  {formatCurrency(round.netProfitIfWin)}
                </td>
                <td className="currency">{formatCurrency(round.remainingBankroll)}</td>
                <td className="status">
                  {round.targetMet && <span className="badge success">Target Met</span>}
                  {round.breakeven && !round.targetMet && <span className="badge neutral">Breakeven</span>}
                  {round.remainingBankroll < round.betAmount * config.betMultiplier && <span className="badge danger">Insufficient Funds</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {progression.length > 10 && !showAllRounds && (
        <div className="table-footer">
          <p>Showing first 10 of {progression.length} rounds. <button onClick={() => setShowAllRounds(true)} className="link-button">Show all rounds</button></p>
        </div>
      )}

      {/* Table Legend */}
      <div className="table-legend">
        <h4>Table Legend</h4>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="badge success">Target Met</span>
            <span>This round achieves your target profit</span>
          </div>
          <div className="legend-item">
            <span className="badge neutral">Breakeven</span>
            <span>This round breaks even or shows minimal profit</span>
          </div>
          <div className="legend-item">
            <span className="badge danger">Insufficient Funds</span>
            <span>Cannot continue after this round due to bankroll limit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;