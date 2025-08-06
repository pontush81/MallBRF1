# Data Retention Manager - Test Strategy

> Comprehensive testing strategy for critical data retention functionality following GDPR compliance and best practices.

## 🎯 Overview

This testing strategy ensures the Data Retention Manager operates safely and complies with GDPR and Swedish law requirements. Based on expert recommendations from Perplexity and industry best practices.

## 📋 Test Categories

### 1. **Unit Tests** (`DataRetentionManager.test.tsx`)
Tests individual component functionality and logic in isolation.

**Coverage:**
- ✅ Component rendering and initial state
- ✅ Retention analysis function
- ✅ Data cleanup function (dry-run and live)
- ✅ Safety calculations and status colors
- ✅ Error handling and edge cases
- ✅ GDPR compliance verification
- ✅ User interaction flows

**Key Safety Tests:**
- Prevents cleanup when no analysis exists
- Validates safety calculations (candidates vs safe-to-delete)
- Handles empty results gracefully
- Shows appropriate warnings for dangerous operations

### 2. **Integration Tests** (`dataRetentionSafety.test.ts`)
Tests communication with Edge Functions and safety rule validation.

**Coverage:**
- ✅ Edge Function communication (`analyze_retention`, `cleanup_data`, `get_retention_status`)
- ✅ Safety rule validation (active bookings, payment status, GDPR conflicts)
- ✅ Retention period compliance (Swedish law, GDPR requirements)
- ✅ Error handling (authentication failures, timeouts, partial failures)
- ✅ GDPR compliance edge cases (audit trails, accounting data)

**Critical Safety Validations:**
- Users with active bookings are NOT deleted
- Bookings with unresolved payments are preserved
- GDPR deletion requests are handled separately
- Swedish Accounting Law (7-year retention) is respected
- Security-critical audit logs are preserved

### 3. **End-to-End Tests** (`data-retention-manager.cy.ts`)
Tests complete user journeys and real-world scenarios.

**Coverage:**
- ✅ Page loading and initial state
- ✅ Complete retention analysis flow
- ✅ Dry-run cleanup workflow
- ✅ Live mode cleanup (dangerous operations)
- ✅ Error handling and recovery
- ✅ GDPR compliance verification
- ✅ Mobile responsiveness
- ✅ Accessibility compliance

**User Journey Tests:**
1. Admin navigates to retention page
2. Runs analysis and reviews results
3. Performs dry-run to preview changes
4. Reviews safety warnings and errors
5. Makes informed decision about live cleanup
6. Monitors results and handles errors

## 🛡️ Safety-First Testing Approach

### Critical Safety Rules Tested:

#### **User Data Retention:**
- ✅ No deletion if user has active/future bookings
- ✅ No deletion if user logged in within 6 months
- ✅ No deletion if membership is still active
- ✅ Exception for board members (styrelse_member)

#### **Booking Data Retention:**
- ✅ No deletion if payment not settled
- ✅ No deletion if booking is still active
- ✅ No deletion if dispute is ongoing
- ✅ Swedish Accounting Law compliance (7 years)

#### **Audit Log Retention:**
- ✅ Security-critical events are preserved
- ✅ Logs part of active investigation are kept
- ✅ GDPR request logs kept for 5 years

#### **GDPR Compliance:**
- ✅ Proper handling of existing GDPR deletion requests
- ✅ Data minimization principles followed
- ✅ Audit trail preservation
- ✅ Legal basis validation for retention

## 🧪 Test Data Strategy

### Mock Data Principles:
- **No Real Personal Data:** All test data is anonymized/mocked
- **Realistic Scenarios:** Edge cases reflect real-world situations
- **Safety-First:** Tests assume dangerous operations by default
- **Compliance-Focused:** Mock data follows GDPR and Swedish law

### Example Test Scenarios:
```typescript
// Safe deletion scenario
{
  candidateCount: 5,
  safeToDeleteCount: 2,  // Only 2 out of 5 are safe
  errors: [
    'User has active bookings',
    'Membership still active',
    'Recent login detected'
  ]
}

// GDPR compliance scenario  
{
  table: 'users',
  retentionDays: 730,  // 2 years after membership ends
  safetyChecks: ['no_active_bookings', 'membership_ended'],
  exceptions: ['styrelse_member', 'gdpr_deletion_pending']
}
```

## 🔄 Test Execution Strategy

### 1. **Development Phase:**
```bash
# Run unit tests during development
npm test DataRetentionManager.test.tsx

# Run integration tests for safety validation
npm test dataRetentionSafety.test.ts
```

### 2. **Pre-Deployment:**
```bash
# Full test suite
npm test

# E2E tests for complete user flows
npm run cypress:run
```

### 3. **CI/CD Pipeline:**
- All tests run automatically on PR creation
- E2E tests run on staging environment
- Safety tests are mandatory for deployment

## ⚠️ Critical Test Failures

**These test failures should BLOCK deployment:**

1. **Safety Rule Violations:** Any test showing unsafe deletion
2. **GDPR Non-Compliance:** Legal requirement violations
3. **Data Loss Prevention:** Tests ensuring no accidental deletion
4. **Authentication Failures:** Unauthorized access to retention features

## 📊 Test Coverage Requirements

### Minimum Coverage Targets:
- **Unit Tests:** 90%+ for retention logic functions
- **Integration Tests:** 100% for safety rule validation
- **E2E Tests:** 80%+ for critical user paths

### Critical Paths (100% Coverage Required):
- Safety rule validation logic
- GDPR compliance checks
- Dry-run vs live mode switching
- Error handling for dangerous operations

## 🔍 Monitoring and Alerting

### Test Monitoring:
- **Failed Tests Alert:** Immediate notification for any test failure
- **Coverage Drops:** Alert if coverage falls below thresholds
- **Performance Regression:** Tests taking longer than expected

### Production Monitoring:
- **Retention Operations:** Log all retention analysis and cleanup
- **Safety Rule Triggers:** Monitor safety rule violations
- **GDPR Compliance:** Track compliance with legal requirements

## 📈 Continuous Improvement

### Regular Reviews:
- **Monthly:** Review test coverage and add edge cases
- **Quarterly:** Update tests based on new legal requirements
- **Annually:** Full review of retention policies and test alignment

### Test Maintenance:
- Keep mocks aligned with actual Edge Function responses
- Update safety rules as business requirements change
- Add new test scenarios based on production issues

## 🎯 Success Criteria

### Test Suite Success Indicators:
1. **Zero False Positives:** Tests only fail for real issues
2. **High Confidence:** Tests give confidence in safe deployment
3. **Fast Feedback:** Tests run quickly during development
4. **Clear Failures:** Test failures clearly indicate the problem

### Compliance Success:
1. **Legal Compliance:** Tests verify GDPR and Swedish law adherence
2. **Data Safety:** No accidental data loss in production
3. **Audit Trail:** All retention operations are properly logged
4. **User Trust:** Users can trust data is handled responsibly

---

## 🏃‍♂️ Quick Start

### Run All Tests:
```bash
# Unit and integration tests
npm test

# E2E tests  
npm run cypress:open

# Specific test file
npm test DataRetentionManager.test.tsx
```

### Test in CI/CD:
```bash
# Headless mode for CI
npm run test:ci
npm run cypress:run
```

This comprehensive testing strategy ensures the Data Retention Manager operates safely, legally, and reliably in production. 🛡️