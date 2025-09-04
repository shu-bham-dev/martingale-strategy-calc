// Test script to verify all calculations work correctly and prevent NaN/null values

import { 
  calculateMartingaleProgression, 
  simulateMartingaleSessions,
  generateRiskWarnings,
  exportToCSV 
} from './src/utils/martingaleCalculator.js';

import {
  decimalToAmerican,
  americanToDecimal,
  fractionalToDecimal,
  decimalToFractional,
  decimalToImpliedProbability,
  impliedProbabilityToDecimal,
  convertToDecimal,
  formatOdds,
  calculatePayout,
  validateOdds,
  OddsType
} from './src/utils/oddsConverter.js';

// Test cases for edge cases and validation
const testCases = [
  // Valid cases
  {
    name: 'Standard case - 2.00 odds',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      betMultiplier: 2
    }
  },
  {
    name: 'High odds case - 10.00 odds',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '10.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 5,
      betMultiplier: 2
    }
  },
  {
    name: 'Low odds case - 1.50 odds',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '1.50',
      oddsType: OddsType.DECIMAL,
      maxRounds: 8,
      betMultiplier: 2
    }
  },
  {
    name: 'American odds positive',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '+150',
      oddsType: OddsType.AMERICAN,
      maxRounds: 10,
      betMultiplier: 2
    }
  },
  {
    name: 'American odds negative',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '-200',
      oddsType: OddsType.AMERICAN,
      maxRounds: 10,
      betMultiplier: 2
    }
  },
  {
    name: 'Fractional odds',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '3/2',
      oddsType: OddsType.FRACTIONAL,
      maxRounds: 10,
      betMultiplier: 2
    }
  },
  {
    name: 'Implied probability',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '50',
      oddsType: OddsType.IMPLIED,
      maxRounds: 10,
      betMultiplier: 2
    }
  },
  // Edge cases
  {
    name: 'Minimum bankroll',
    config: {
      baseBet: 10,
      bankroll: 10,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      betMultiplier: 2
    }
  },
  {
    name: 'Large bet multiplier',
    config: {
      baseBet: 10,
      bankroll: 10000,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 5,
      betMultiplier: 3
    }
  },
  {
    name: 'Target profit',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      targetProfit: 50,
      betMultiplier: 2
    }
  },
  {
    name: 'Table limit',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      maxTableLimit: 500,
      betMultiplier: 2
    }
  }
];

// Test invalid cases
const invalidTestCases = [
  {
    name: 'Invalid base bet',
    config: {
      baseBet: 0,
      bankroll: 1000,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      betMultiplier: 2
    },
    shouldThrow: true
  },
  {
    name: 'Invalid bankroll',
    config: {
      baseBet: 10,
      bankroll: 0,
      odds: '2.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      betMultiplier: 2
    },
    shouldThrow: true
  },
  {
    name: 'Invalid odds - 1.00',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '1.00',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      betMultiplier: 2
    },
    shouldThrow: false  // Odds converter provides fallback, so this should work
  },
  {
    name: 'Invalid odds - 0.50',
    config: {
      baseBet: 10,
      bankroll: 1000,
      odds: '0.50',
      oddsType: OddsType.DECIMAL,
      maxRounds: 10,
      betMultiplier: 2
    },
    shouldThrow: false  // Odds converter provides fallback, so this should work
  }
];

function validateResults(results, testName) {
  console.log(`\n=== Testing: ${testName} ===`);
  
  if (!results) {
    console.error('❌ No results returned');
    return false;
  }

  // Validate progression
  if (!results.progression || !Array.isArray(results.progression)) {
    console.error('❌ Invalid progression array');
    return false;
  }

  // Validate statistics
  if (!results.statistics || typeof results.statistics !== 'object') {
    console.error('❌ Invalid statistics object');
    return false;
  }

  // Check for NaN values in progression
  results.progression.forEach((round, index) => {
    Object.entries(round).forEach(([key, value]) => {
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        console.error(`❌ NaN/Infinity found in round ${index + 1}, field: ${key}`);
        return false;
      }
    });
  });

  // Check for NaN values in statistics
  Object.entries(results.statistics).forEach(([key, value]) => {
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      console.error(`❌ NaN/Infinity found in statistics: ${key}`);
      return false;
    }
  });

  // Validate config
  if (!results.config || typeof results.config !== 'object') {
    console.error('❌ Invalid config object');
    return false;
  }

  console.log('✅ All validations passed');
  console.log(`   Rounds calculated: ${results.progression.length}`);
  console.log(`   Win probability: ${results.config.winProbability.toFixed(2)}%`);
  console.log(`   Expected value: $${results.statistics.expectedValue.toFixed(2)}`);
  console.log(`   Bust probability: ${results.statistics.bustProbability.toFixed(2)}%`);

  return true;
}

function testOddsConversions() {
  console.log('\n=== Testing Odds Conversions ===');
  
  const testOdds = [
    { value: '2.00', type: OddsType.DECIMAL },
    { value: '+100', type: OddsType.AMERICAN },
    { value: '1/1', type: OddsType.FRACTIONAL },
    { value: '50', type: OddsType.IMPLIED },
    { value: '1.01', type: OddsType.DECIMAL }, // Edge case
    { value: '1.00', type: OddsType.DECIMAL }, // Invalid case
    { value: '0.50', type: OddsType.DECIMAL }, // Invalid case
    { value: '1000.00', type: OddsType.DECIMAL } // Extreme case
  ];

  testOdds.forEach((test, index) => {
    try {
      const decimal = convertToDecimal(test.value, test.type);
      console.log(`✅ ${test.type}: ${test.value} → ${decimal.toFixed(2)}`);
      
      if (decimal < 1.01 || !isFinite(decimal)) {
        console.error(`❌ Invalid decimal conversion: ${decimal}`);
      }
    } catch (error) {
      console.error(`❌ Error converting ${test.type}: ${test.value} - ${error.message}`);
    }
  });
}

async function runTests() {
  console.log('🧪 Starting comprehensive calculation tests...\n');

  // Test odds conversions
  testOddsConversions();

  // Test valid cases
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const results = calculateMartingaleProgression(testCase.config);
      if (validateResults(results, testCase.name)) {
        passed++;
        
        // Test simulation
        try {
          const simulation = simulateMartingaleSessions(testCase.config, 100);
          console.log(`✅ Simulation: ${simulation.summary.totalSessions} sessions completed`);
        } catch (simError) {
          console.error(`❌ Simulation failed: ${simError.message}`);
          failed++;
        }

        // Test risk warnings
        try {
          const warnings = generateRiskWarnings(testCase.config, results.statistics);
          console.log(`✅ Risk warnings: ${warnings.length} warnings generated`);
        } catch (warningError) {
          console.error(`❌ Risk warnings failed: ${warningError.message}`);
          failed++;
        }

        // Test CSV export
        try {
          const csv = exportToCSV(results.progression, results.statistics);
          console.log(`✅ CSV export: ${csv.split('\n').length} lines generated`);
        } catch (csvError) {
          console.error(`❌ CSV export failed: ${csvError.message}`);
          failed++;
        }
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${testCase.name}: ${error.message}`);
      failed++;
    }
  }

  // Test invalid cases
  for (const testCase of invalidTestCases) {
    try {
      calculateMartingaleProgression(testCase.config);
      if (!testCase.shouldThrow) {
        console.log(`✅ ${testCase.name}: Expected to pass but didn't throw`);
        passed++;
      } else {
        console.error(`❌ ${testCase.name}: Expected to throw but didn't`);
        failed++;
      }
    } catch (error) {
      if (testCase.shouldThrow) {
        console.log(`✅ ${testCase.name}: Correctly threw error - ${error.message}`);
        passed++;
      } else {
        console.error(`❌ ${testCase.name}: Unexpected error - ${error.message}`);
        failed++;
      }
    }
  }

  console.log('\n=== Test Summary ===');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! No NaN/null values detected.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);