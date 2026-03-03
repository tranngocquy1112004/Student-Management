#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const testTypes = {
  unit: 'src/__tests__/unit',
  integration: 'src/__tests__/integration', 
  property: 'src/__tests__/property',
  all: 'src/__tests__'
};

const runTests = async (type = 'all') => {
  console.log(`🧪 Running ${type} tests for Attendance module...\n`);
  
  const testPath = testTypes[type];
  if (!existsSync(testPath)) {
    console.error(`❌ Test directory not found: ${testPath}`);
    process.exit(1);
  }

  try {
    const command = `npm test -- ${testPath} --verbose`;
    console.log(`📝 Command: ${command}\n`);
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n✅ Tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed!');
    process.exit(1);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';

if (!testTypes[testType]) {
  console.error(`❌ Invalid test type: ${testType}`);
  console.log('Available types: unit, integration, property, all');
  process.exit(1);
}

runTests(testType);
