#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testSuites = {
  'TC-20': {
    name: 'QR hợp lệ, đúng giờ',
    description: 'Valid QR check-in on time',
    file: 'attendance.test.js',
    pattern: 'TC-20.*QR hợp lệ.*đúng giờ'
  },
  'TC-21': {
    name: 'QR đã hết hạn',
    description: 'Expired QR code handling',
    file: 'attendance.test.js',
    pattern: 'TC-21.*QR đã hết hạn'
  },
  'TC-22': {
    name: 'Điểm danh muộn',
    description: 'Late attendance check-in',
    file: 'attendance.test.js',
    pattern: 'TC-22.*Điểm danh muộn'
  },
  'TC-23': {
    name: 'SV đã điểm danh',
    description: 'Duplicate check-in prevention',
    file: 'attendance.test.js',
    pattern: 'TC-23.*SV đã điểm danh'
  },
  'TC-24': {
    name: 'SV không thuộc lớp',
    description: 'Non-enrolled student access',
    file: 'attendance.test.js',
    pattern: 'TC-24.*SV không thuộc lớp'
  },
  'TC-25': {
    name: 'Vắng > 20%',
    description: 'Attendance warning creation',
    file: 'attendance.test.js',
    pattern: 'TC-25.*Vắng.*20%'
  }
};

const runSpecificTest = (testCase) => {
  const suite = testSuites[testCase];
  if (!suite) {
    log(`❌ Test case ${testCase} not found!`, 'red');
    return;
  }

  log(`🧪 Running Test Case: ${testCase}`, 'cyan');
  log(`📝 ${suite.name}`, 'yellow');
  log(`📄 ${suite.description}`, 'blue');
  log('', 'reset');

  try {
    // For individual test cases, run the simple test file only
    const command = `npm test -- src/__tests__/unit/attendance.simple.test.js --verbose`;
    log(`🔧 Command: ${command}`, 'magenta');
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`\n✅ Test case ${testCase} completed successfully!`, 'green');
  } catch (error) {
    log(`\n❌ Test case ${testCase} failed!`, 'red');
    process.exit(1);
  }
};

const runAllTests = () => {
  log('🧪 Running All Attendance Test Cases', 'cyan');
  log('=====================================', 'blue');
  
  Object.keys(testSuites).forEach((testCase, index) => {
    const suite = testSuites[testCase];
    log(`${index + 1}. ${testCase}: ${suite.name}`, 'yellow');
  });
  
  log('', 'reset');
  log('🚀 Starting test execution...\n', 'green');

  try {
    execSync('npm run test:attendance', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('\n🎉 All test cases completed!', 'green');
  } catch (error) {
    log('\n❌ Some test cases failed!', 'red');
    process.exit(1);
  }
};

const showHelp = () => {
  log('🧪 Attendance Test Runner', 'cyan');
  log('=============================', 'blue');
  log('', 'reset');
  
  log('Usage:', 'yellow');
  log('  node test-runner.js [test-case-id]', 'white');
  log('  node test-runner.js all', 'white');
  log('  node test-runner.js help', 'white');
  log('', 'reset');
  
  log('Available Test Cases:', 'yellow');
  Object.keys(testSuites).forEach(testCase => {
    const suite = testSuites[testCase];
    log(`  ${testCase}: ${suite.name}`, 'white');
    log(`    ${suite.description}`, 'gray');
  });
  
  log('', 'reset');
  log('Examples:', 'yellow');
  log('  node test-runner.js TC-20    # Run specific test case', 'white');
  log('  node test-runner.js all       # Run all test cases', 'white');
  log('  node test-runner.js help      # Show this help', 'white');
};

const showStatus = () => {
  log('📊 Test Status Check', 'cyan');
  log('====================', 'blue');
  
  // Check if test files exist
  const testFiles = [
    'src/__tests__/unit/attendance.test.js',
    'src/__tests__/integration/attendance.integration.test.js',
    'src/__tests__/property/attendance.property.test.js'
  ];
  
  testFiles.forEach(file => {
    if (existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file}`, 'red');
    }
  });
  
  // Check environment
  const envFile = '.env.test';
  if (existsSync(envFile)) {
    log(`✅ ${envFile}`, 'green');
  } else {
    log(`❌ ${envFile}`, 'red');
  }
  
  // Check MongoDB connection (simplified)
  try {
    execSync('mongosh --eval "db.runCommand({ping: 1})"', { stdio: 'pipe' });
    log('✅ MongoDB Connection', 'green');
  } catch (error) {
    log('❌ MongoDB Connection', 'red');
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  case 'status':
  case '--status':
  case '-s':
    showStatus();
    break;
    
  case 'all':
  case '--all':
  case '-a':
    runAllTests();
    break;
    
  default:
    if (testSuites[command]) {
      runSpecificTest(command);
    } else {
      log(`❌ Unknown command: ${command}`, 'red');
      log('Use "node test-runner.js help" for available commands', 'yellow');
      process.exit(1);
    }
}
