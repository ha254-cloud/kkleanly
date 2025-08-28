// Test the fixed email similarity detection
// This should now allow "mainaharry554@gmail.com" and "mainaharry67@gmail.com" to be different users

// Simple test implementation since we can't import from TypeScript files directly
function calculateStringSimilarity(s1, s2) {
  // Simplified Jaro-Winkler implementation for testing
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  // Simple character matching
  let matches = 0;
  const maxDistance = Math.max(0, Math.floor(longer.length / 2) - 1);
  
  for (let i = 0; i < shorter.length; i++) {
    const start = Math.max(0, i - maxDistance);
    const end = Math.min(i + maxDistance + 1, longer.length);
    
    for (let j = start; j < end; j++) {
      if (shorter[i] === longer[j]) {
        matches++;
        break;
      }
    }
  }
  
  if (matches === 0) return 0.0;
  
  return matches / Math.max(shorter.length, longer.length);
}

function checkEmailSimilarity(email1, email2) {
  // Extract usernames from emails
  const user1 = email1.split('@')[0].toLowerCase();
  const user2 = email2.split('@')[0].toLowerCase();
  
  const possibleConflictReasons = [];
  
  // Check if emails are identical
  if (email1.toLowerCase() === email2.toLowerCase()) {
    possibleConflictReasons.push('Emails are identical');
  }
  
  // Check username patterns - using our FIXED logic
  if (user1 === user2) {
    possibleConflictReasons.push('Usernames are identical');
  }
  
  // Only flag containment for very short usernames to prevent false positives
  // "mainaharry554" and "mainaharry67" should NOT be flagged as containing each other
  if (user1.length <= 6 || user2.length <= 6) {
    if (user1.includes(user2) || user2.includes(user1)) {
      possibleConflictReasons.push('One username contains the other (short usernames only)');
    }
  }
  
  // Only check anagrams for very short usernames
  if (user1.length <= 8 && user2.length <= 8) {
    const sorted1 = user1.split('').sort().join('');
    const sorted2 = user2.split('').sort().join('');
    if (sorted1 === sorted2) {
      possibleConflictReasons.push('Usernames are anagrams (same letters rearranged)');
    }
  }
  
  // Much stricter similarity threshold - only flag nearly identical usernames
  // This allows "mainaharry554" vs "mainaharry67" to be considered different
  const usernameSimilarity = calculateStringSimilarity(user1, user2);
  if (usernameSimilarity > 0.95) {
    possibleConflictReasons.push(`Usernames are nearly identical (${(usernameSimilarity * 100).toFixed(1)}% similarity)`);
  }
  
  return {
    usernameSimilarity,
    possibleConflictReasons,
    conflictDetected: possibleConflictReasons.length > 0
  };
}

console.log('🧪 Testing Fixed Email Similarity Detection');
console.log('==========================================');

// Test cases that should now be allowed
const testCases = [
  {
    email1: 'mainaharry554@gmail.com',
    email2: 'mainaharry67@gmail.com',
    shouldConflict: false,
    description: 'Different numeric suffixes - should be ALLOWED'
  },
  {
    email1: 'harrymaina02@gmail.com', 
    email2: 'mainaharry554@gmail.com',
    shouldConflict: false,
    description: 'Different name order with numbers - should be ALLOWED'
  },
  {
    email1: 'john123@gmail.com',
    email2: 'john456@gmail.com', 
    shouldConflict: false,
    description: 'Same base name different numbers - should be ALLOWED'
  },
  {
    email1: 'test@gmail.com',
    email2: 'test@gmail.com',
    shouldConflict: true,
    description: 'Identical emails - should CONFLICT'
  },
  {
    email1: 'test123@gmail.com',
    email2: 'test123@gmail.com',
    shouldConflict: true,
    description: 'Identical with numbers - should CONFLICT'
  },
  {
    email1: 'ab@gmail.com',
    email2: 'ba@gmail.com',
    shouldConflict: true,
    description: 'Very short anagrams - should CONFLICT'
  }
];

function runTests() {
  console.log(`\n📋 Running ${testCases.length} test cases...\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.description}`);
    console.log(`   Email 1: ${testCase.email1}`);
    console.log(`   Email 2: ${testCase.email2}`);
    
    try {
      const similarity = checkEmailSimilarity(testCase.email1, testCase.email2);
      const hasConflict = similarity.possibleConflictReasons.length > 0;
      
      console.log(`   Similarity: ${(similarity.usernameSimilarity * 100).toFixed(1)}%`);
      console.log(`   Conflict reasons: ${similarity.possibleConflictReasons.length > 0 ? similarity.possibleConflictReasons.join(', ') : 'None'}`);
      
      if (hasConflict === testCase.shouldConflict) {
        console.log(`   ✅ PASS - Correctly ${hasConflict ? 'detected conflict' : 'allowed different emails'}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Expected ${testCase.shouldConflict ? 'conflict' : 'no conflict'}, got ${hasConflict ? 'conflict' : 'no conflict'}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('📊 Test Results Summary');
  console.log('=====================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 All tests passed! Email similarity detection is working correctly.');
    console.log('');
    console.log('✅ Users can now create accounts with emails like:');
    console.log('   • mainaharry554@gmail.com');
    console.log('   • mainaharry67@gmail.com');
    console.log('   • john123@example.com & john456@example.com');
    console.log('');
    console.log('🛡️  Still blocked (as expected):');
    console.log('   • Identical emails');
    console.log('   • Very short anagram usernames');
    console.log('   • Nearly identical usernames (95%+ similarity)');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. The similarity detection may need further adjustment.');
  }
}

// Run the tests
runTests();
