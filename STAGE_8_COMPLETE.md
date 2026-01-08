# Stage 8 Complete: Case Management & Mobile Integration

## What We Built

### 1. Case Management Service
Created a comprehensive case management system for organizing spam calls into legal cases.

**File**: [case-management.service.ts](backend/src/services/case-management.service.ts)

**Features**:
- **Create Cases**: Group multiple spam calls into a legal case
- **Estimate Payouts**: Automatically calculate potential compensation
  - TCPA violations: $1,000 per violation
  - FDCPA violations: $1,000 per violation
  - FTC violations: $500 per violation
- **Track Status**: Manage case lifecycle (pending → filed → in_progress → settled → closed)
- **Link Calls**: Many-to-many relationship between cases and calls
- **Unassigned Calls**: Find spam calls not yet in any case

### 2. Case Management API
Full REST API for case management operations.

**File**: [case.routes.ts](backend/src/routes/case.routes.ts)

**Endpoints**:

#### Create Case
```
POST /api/cases/create
{
  "user_id": "uuid",
  "case_title": "Debt Collector Harassment Case",
  "call_ids": ["call-id-1", "call-id-2"],
  "notes": "Multiple FDCPA violations"
}
```

#### Get Case Details
```
GET /api/cases/:caseId
```
Returns case with all linked calls and violations

#### Get User Cases
```
GET /api/cases/user/:userId
```

#### Update Status
```
PATCH /api/cases/:caseId/status
{
  "status": "filed",
  "actual_payout": 3000
}
```

#### Manage Case Calls
```
POST /api/cases/:caseId/calls
DELETE /api/cases/:caseId/calls/:callId
```

### 3. Mobile App: Cases Screen
Beautiful case management interface in the mobile app.

**File**: [CasesScreen.tsx](mobile-app/src/screens/CasesScreen.tsx)

**Features**:
- **Case List**: All legal cases with status badges
- **Color-Coded Status**:
  - 🟠 Pending (Orange)
  - 🔵 Filed (Blue)
  - 🟣 In Progress (Purple)
  - 🟢 Settled (Green)
  - ⚪ Closed (Gray)
- **Payout Display**: Shows estimated and actual payouts
- **Real-time Updates**: Auto-refresh when cases change
- **Pull-to-Refresh**: Manual refresh capability
- **Empty State**: Helpful message when no cases exist
- **Create Button**: Easy case creation access

### 4. Home Screen Integration
Added easy access to legal cases from the home screen.

**Modified**: [HomeScreen.tsx](mobile-app/src/screens/HomeScreen.tsx)

Added "⚖️ Legal Cases" button that navigates to the cases screen.

## How to Use

### Step 1: View Your Cases
1. Open mobile app
2. On home screen, tap "⚖️ Legal Cases"
3. See list of all your legal cases
4. Tap any case to view details (coming in next stage)

### Step 2: Check Unassigned Calls
API endpoint to find spam calls not in any case:
```
GET /api/cases/user/:userId/unassigned
```

### Step 3: Create a Case (API)
```bash
curl -X POST http://localhost:3000/api/cases/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "case_title": "Debt Collector Violations - June 2025",
    "call_ids": ["call-id-1", "call-id-2", "call-id-3"],
    "notes": "Multiple FDCPA violations including false threats"
  }'
```

The system automatically:
- Fetches all violations for the calls
- Calculates estimated payout based on violation types
- Creates case with "pending" status
- Links all calls to the case

### Step 4: Track Progress
Update case status as it progresses:
```bash
curl -X PATCH http://localhost:3000/api/cases/{caseId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "filed"
  }'
```

Status progression:
1. **pending** - Case created, gathering evidence
2. **filed** - Complaint filed with court/agency
3. **in_progress** - Active litigation or negotiation
4. **settled** - Settlement reached
5. **closed** - Case completed

## Payout Calculation Example

**Scenario**: 3 calls with the following violations:

Call 1:
- FDCPA - False Threats: $1,000
- FDCPA - Harassment: $1,000

Call 2:
- TCPA - Robocall: $1,000
- TCPA - False Urgency: $1,000

Call 3:
- FDCPA - Third Party Disclosure: $1,000
- FDCPA - False Threats: $1,000
- FTC - Deceptive Practices: $500

**Estimated Payout**: $6,500

## Case Status Lifecycle

```
pending
   ↓
filed (lawsuit/complaint submitted)
   ↓
in_progress (litigation/negotiation)
   ↓
settled (agreement reached) → actual_payout recorded
   ↓
closed (case finalized)
```

## Database Structure

### legal_cases Table
```sql
id                 UUID
user_id            UUID → auth.users
case_title         VARCHAR(255)
case_status        VARCHAR(50)
estimated_payout   DECIMAL(10,2)
actual_payout      DECIMAL(10,2)
notes              TEXT
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### case_calls Table (Join Table)
```sql
case_id   UUID → legal_cases
call_id   UUID → calls
added_at  TIMESTAMP
```

## Mobile App UI

### Cases List Screen
- Header with back button and "+ New" button
- Case cards showing:
  - Case title
  - Status badge (color-coded)
  - Estimated payout
  - Actual payout (if settled)
  - Creation date
- Empty state with "Create Your First Case" button
- Pull-to-refresh support

### Navigation
```
Home → Tap "⚖️ Legal Cases" → Cases List
                                    ↓
                              Tap Case → Case Details (future)
```

## Technical Implementation

### Service Functions
```typescript
// Create case
createCase({ user_id, case_title, call_ids, notes })

// Get case with full details
getCaseById(caseId)

// Get all user cases
getUserCases(userId)

// Update status
updateCaseStatus(caseId, status, actualPayout?)

// Manage calls
addCallsToCase(caseId, callIds)
removeCallFromCase(caseId, callId)

// Delete case
deleteCase(caseId)

// Find unassigned calls
getUnassignedSpamCalls(userId)
```

### Real-time Synchronization
```typescript
const channel = supabase
  .channel('cases-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'legal_cases',
  }, () => {
    fetchCases();
  })
  .subscribe();
```

## Files Created/Modified

### New Files:
- [case-management.service.ts](backend/src/services/case-management.service.ts) - Case management logic
- [case.routes.ts](backend/src/routes/case.routes.ts) - Case API endpoints
- [CasesScreen.tsx](mobile-app/src/screens/CasesScreen.tsx) - Mobile cases list

### Modified Files:
- [index.ts](backend/src/index.ts) - Added case routes
- [HomeScreen.tsx](mobile-app/src/screens/HomeScreen.tsx) - Added Legal Cases button
- [AppNavigator.tsx](mobile-app/src/navigation/AppNavigator.tsx) - Added Cases screen
- [types/index.ts](mobile-app/src/types/index.ts) - Added LegalCase type

## What's Next (Stage 9)

Planned features:
1. **Case Details Screen**: Full case view with calls and violations
2. **Create Case Screen**: UI to create cases from mobile app
3. **PDF Evidence Export**: Generate legal documents
4. **Email Evidence**: Send evidence to lawyers
5. **Case Notes**: Add documentation to cases
6. **Settlement Tracking**: Record settlement details

## Progress Summary

**Completed Stages:**
1. ✅ Project Setup
2. ✅ Database & Supabase
3. ✅ Backend API
4. ✅ AI Services (Groq LLM)
5. ✅ Mobile App Foundation
6. ✅ Dashboard & Call History
7. ✅ Violation Detection & Test Data
8. ✅ Case Management & Mobile Integration

**Current Progress: 80% Complete**

## API Testing

### Create a test case:
```bash
# First, get your user ID and call IDs from the database
# Then create a case:

curl -X POST http://localhost:3000/api/cases/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id-here",
    "case_title": "Test Case - Multiple FDCPA Violations",
    "call_ids": ["call-id-1", "call-id-2"],
    "notes": "Testing case management system"
  }'
```

### Get all cases:
```bash
curl http://localhost:3000/api/cases/user/your-user-id
```

### Update case status:
```bash
curl -X PATCH http://localhost:3000/api/cases/{case-id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "filed"}'
```

## Notes

- Cases automatically calculate estimated payouts based on violations
- Status changes are tracked with timestamps
- Real-time updates keep mobile app synchronized
- Unassigned spam calls can be found and added to cases
- Multiple calls can be grouped into a single case
- Cases persist across app sessions
- Color-coded status makes tracking easy

The case management system is complete and ready to organize spam calls for legal action!
