# Board Role Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `board` role so board members can access the maintenance plan and fault reports in admin, without seeing other admin pages.

**Architecture:** Extend the existing binary role system (`user` | `admin`) with a third role `board`. The `ProtectedRoute` component switches from a boolean `adminOnly` flag to an `allowedRoles` array. DashboardHome filters cards by role. RLS policies are extended to allow board members to read/update fault reports.

**Tech Stack:** React 18, TypeScript, MUI, React Router v6, Supabase (RLS), Jest via craco

---

### Task 1: Define `UserRole` type and update all type interfaces

**Files:**
- Modify: `src/types/User.ts`
- Modify: `src/services/supabaseAuthNew.ts`

**Step 1: Update `src/types/User.ts`**

Add a shared `UserRole` type and use it in both interfaces:

```typescript
export type UserRole = 'user' | 'board' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive?: boolean;
  pendingApproval?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserFormData {
  email: string;
  name?: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
}
```

**Step 2: Update `src/services/supabaseAuthNew.ts`**

Import `UserRole` and use it in the `AuthUser` interface and all casts:

```typescript
import { UserRole } from '../types/User';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
}
```

Replace every `as 'user' | 'admin'` cast with `as UserRole`. These appear on approximately lines: 247, 280, 495, 549, 575, 648, 666.

**Step 3: Run type check to verify no breakage**

Run: `npx tsc --noEmit`
Expected: No new type errors (existing errors are OK)

**Step 4: Commit**

```bash
git add src/types/User.ts src/services/supabaseAuthNew.ts
git commit -m "feat: add UserRole type with 'board' role"
```

---

### Task 2: Update AuthContext with `isBoard`

**Files:**
- Modify: `src/context/AuthContextNew.tsx`

**Step 1: Add `isBoard` state and expose it**

Update the `AuthContextType` interface:

```typescript
interface AuthContextType {
  currentUser: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isBoard: boolean;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}
```

Add state:

```typescript
const [isBoard, setIsBoard] = useState(false);
```

Update all three places where `setIsAdmin` is called to also set `isBoard`:

1. `initAuth` (line ~47):
```typescript
setIsAdmin(user.role === 'admin');
setIsBoard(user.role === 'board');
```

2. `onAuthStateChange` callback (line ~61):
```typescript
setIsAdmin(user.role === 'admin');
setIsBoard(user.role === 'board');
```

3. `login` function (line ~117):
```typescript
setIsAdmin(user.role === 'admin');
setIsBoard(user.role === 'board');
```

4. `clearUserData` (line ~106):
```typescript
setIsBoard(false);
```

5. Add `isBoard` to the context value object (line ~144):
```typescript
const value: AuthContextType = {
  currentUser,
  isLoggedIn,
  isAdmin,
  isBoard,
  loading,
  login,
  logout
};
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: May see errors where `useAuth()` destructures — those are fine for now and will be fixed in subsequent tasks.

**Step 3: Commit**

```bash
git add src/context/AuthContextNew.tsx
git commit -m "feat: add isBoard to AuthContext"
```

---

### Task 3: Update ProtectedRoute and route definitions

**Files:**
- Modify: `src/App.tsx`

**Step 1: Rewrite `ProtectedRoute` to accept `allowedRoles`**

Replace the current `ProtectedRoute` (lines 122-139) with:

```typescript
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isLoggedIn, currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    // Board members who try admin-only pages → redirect to admin home
    if (currentUser.role === 'board') {
      return <Navigate to="/admin" replace />;
    }
    // Regular users → redirect to public pages
    return <Navigate to="/pages" replace />;
  }

  return <>{children}</>;
};
```

**Step 2: Update the parent `/admin` route guard**

Change line ~273-278 from:

```tsx
<Route path="/admin" element={
  <ProtectedRoute adminOnly>
```

To:

```tsx
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin', 'board']}>
```

**Step 3: Wrap admin-only child routes**

Wrap these routes with an additional `ProtectedRoute allowedRoles={['admin']}`:
- `pages`, `pages/new`, `pages/edit/:id`
- `users`
- `notifications`
- `data-retention`
- `hsb-report`

Example for pages:

```tsx
<Route path="pages" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <Suspense fallback={<LoadingFallback />}>
      <LazyPagesList />
    </Suspense>
  </ProtectedRoute>
} />
```

Routes that board members CAN access (no additional guard needed):
- `index` (DashboardHome)
- `maintenance`
- `felanmalningar`

**Step 4: Verify the app compiles**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: role-based route guards for board members"
```

---

### Task 4: Update DashboardHome to filter cards by role

**Files:**
- Modify: `src/pages/admin/DashboardHome.tsx`

**Step 1: Add `requiredRole` to card interface and use `useAuth`**

Import `useAuth`:

```typescript
import { useAuth } from '../../context/AuthContextNew';
```

Extend the `QuickActionCard` interface:

```typescript
interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  color: string;
  allowedRoles?: string[];  // if omitted, shown to all admin roles
}
```

**Step 2: Tag each card with `allowedRoles`**

Add `allowedRoles: ['admin']` to admin-only cards:
- Hantera Sidor
- Bokningar
- Användare
- Notifikationer
- Data Retention
- HSB-rapport

Leave these without `allowedRoles` (shown to both admin and board):
- Underhållsplan
- Felanmälningar

**Step 3: Filter cards by current user role**

In the component body:

```typescript
const { currentUser } = useAuth();
const userRole = currentUser?.role || 'user';

const visibleActions = quickActions.filter(action => {
  if (!action.allowedRoles) return true;
  return action.allowedRoles.includes(userRole);
});
```

Replace `quickActions.map(...)` with `visibleActions.map(...)` in the render.

**Step 4: Hide the "Snabbåtgärder" section for board users**

The "Skapa Ny Sida" and "Visa Alla Bokningar" buttons at the bottom should only show for admins:

```typescript
{userRole === 'admin' && (
  <Box sx={{ textAlign: 'center' }}>
    {/* ... Snabbåtgärder ... */}
  </Box>
)}
```

**Step 5: Update welcome text for board**

Change the subtitle conditionally:

```typescript
<Typography variant="h6" ...>
  {userRole === 'board'
    ? 'Styrelsevy — underhållsplan och felanmälningar'
    : 'Hantera ditt innehåll och bokningar från en central plats'}
</Typography>
```

**Step 6: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 7: Commit**

```bash
git add src/pages/admin/DashboardHome.tsx
git commit -m "feat: filter dashboard cards by user role"
```

---

### Task 5: Update ModernHeader to show Admin link for board users

**Files:**
- Modify: `src/components/modern/ModernHeader.tsx`

**Step 1: Destructure `isBoard` from `useAuth`**

Change line 41:

```typescript
const { currentUser, isLoggedIn, isAdmin, isBoard, logout } = useAuth();
```

**Step 2: Show Admin nav item for board users too**

Change lines 67-69 from:

```typescript
const adminItems = isAdmin ? [
  { label: 'Admin', path: '/admin', icon: <AdminIcon /> },
] : [];
```

To:

```typescript
const adminItems = (isAdmin || isBoard) ? [
  { label: 'Admin', path: '/admin', icon: <AdminIcon /> },
] : [];
```

**Step 3: Show role chip in mobile drawer for board users**

Change the chip in the mobile drawer footer (line ~363-376) from:

```typescript
{isAdmin && (
  <Chip label="Admin" ... />
)}
```

To:

```typescript
{(isAdmin || isBoard) && (
  <Chip
    label={isAdmin ? 'Admin' : 'Styrelse'}
    ...
  />
)}
```

**Step 4: Show role chip in desktop user menu**

Change the chip in the desktop user menu (line ~595-607) from:

```typescript
{isAdmin && (
  <Chip label="Administratör" ... />
)}
```

To:

```typescript
{(isAdmin || isBoard) && (
  <Chip
    label={isAdmin ? 'Administratör' : 'Styrelsemedlem'}
    ...
  />
)}
```

**Step 5: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```bash
git add src/components/modern/ModernHeader.tsx
git commit -m "feat: show Admin nav link for board members"
```

---

### Task 6: Update UsersList with three-way role selector

**Files:**
- Modify: `src/pages/admin/UsersList.tsx`

**Step 1: Import `UserRole` and update local interface**

```typescript
import { UserRole } from '../../types/User';
```

Change the local `User` interface (line 32-40):

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isactive: boolean;
  createdat: string;
  lastlogin?: string;
}
```

**Step 2: Update `updateUserRole` to accept `UserRole`**

Change line 115:

```typescript
const updateUserRole = async (userId: string, newRole: UserRole) => {
```

**Step 3: Replace the role Chip with a Select/Menu**

Replace the role `Chip` (lines 208-215) with a small `Select`:

```typescript
import { Select, MenuItem as MuiMenuItem } from '@mui/material';
```

```tsx
<TableCell>
  <Select
    value={user.role}
    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
    size="small"
    sx={{ minWidth: 140 }}
  >
    <MuiMenuItem value="user">Användare</MuiMenuItem>
    <MuiMenuItem value="board">Styrelsemedlem</MuiMenuItem>
    <MuiMenuItem value="admin">Administratör</MuiMenuItem>
  </Select>
</TableCell>
```

Note: `MenuItem` is already imported from MUI but used for the user menu. Since `Select` uses `MenuItem` children, this should work. If there's a name conflict, use the existing `MenuItem` import or alias it.

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/pages/admin/UsersList.tsx
git commit -m "feat: three-way role selector in user management"
```

---

### Task 7: Supabase RLS migration for fault_reports

**Files:**
- Create: `supabase/migrations/20260221_board_role_fault_reports_rls.sql`

**Step 1: Write the migration**

Board members should be able to SELECT and UPDATE fault reports (same as admin), but NOT DELETE.

```sql
-- Allow board members to read fault reports (same as admins)
-- Note: The existing SELECT policy may already allow all authenticated users.
-- If it does, this is a no-op. If it only allows admins, this adds board access.
-- Check existing policies first; if SELECT is already open, skip this.

-- Allow board members to update fault reports
CREATE POLICY "Board members can update fault reports"
ON fault_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('admin', 'board')
    AND users.isactive = true
  )
);
```

**Important:** The existing SELECT and INSERT policies for `fault_reports` were created outside migrations (directly in Supabase Studio). You need to verify what exists:
1. Go to Supabase Dashboard → Table Editor → fault_reports → Policies
2. Check if SELECT policy is already open to all authenticated users or admin-only
3. If SELECT is admin-only, add a new policy allowing board too
4. If UPDATE policy exists as admin-only, either drop+recreate or add a board-specific one

The DELETE policy stays admin-only (already exists in migration `20260216164932`).

**Step 2: Note about `users.role` column**

There is no CHECK constraint on `users.role` in the migrations (table was created outside). Verify in Supabase Dashboard that no CHECK constraint exists that would reject `'board'` values. If one exists, alter it:

```sql
-- Only if needed:
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'board', 'admin'));
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260221_board_role_fault_reports_rls.sql
git commit -m "feat: RLS policy for board members on fault_reports"
```

---

### Task 8: Update adminConfig (optional board email auto-assignment)

**Files:**
- Modify: `src/services/auth/adminConfig.ts`

**Step 1: Update return type**

Change `getInitialUserRole` to support all three roles:

```typescript
import { UserRole } from '../../types/User';

export const AUTO_ADMIN_EMAILS = [
  'gulmaranbrf@gmail.com',
  'tinautas@gmail.com',
  'tinautas@hotmail.com',
  'admin@example.com',
];

export const AUTO_BOARD_EMAILS: string[] = [
  // Add board member emails here as needed
];

export function shouldBeAdmin(email: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return AUTO_ADMIN_EMAILS.some(adminEmail =>
    adminEmail.toLowerCase().trim() === normalizedEmail
  );
}

export function shouldBeBoard(email: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return AUTO_BOARD_EMAILS.some(boardEmail =>
    boardEmail.toLowerCase().trim() === normalizedEmail
  );
}

export function getInitialUserRole(email: string): UserRole {
  if (shouldBeAdmin(email)) return 'admin';
  if (shouldBeBoard(email)) return 'board';
  return 'user';
}
```

**Step 2: Commit**

```bash
git add src/services/auth/adminConfig.ts
git commit -m "feat: support auto-assignment of board role by email"
```

---

### Task 9: Manual testing checklist

After all code changes, verify these scenarios manually:

1. **Admin user** — should see all dashboard cards, can access all admin pages
2. **Board user** — set a test user to `board` role via UsersList
   - Should see "Admin" link in header
   - Should see "Styrelsemedlem" chip in user menu
   - DashboardHome shows only Underhållsplan and Felanmälningar cards
   - Can navigate to `/admin/maintenance` and edit
   - Can navigate to `/admin/felanmalningar` and view/update
   - Navigating to `/admin/users` redirects to `/admin`
   - Navigating to `/admin/pages` redirects to `/admin`
3. **Regular user** — should NOT see Admin link, cannot access any `/admin` routes

---

### Summary of all files changed

| File | Change |
|------|--------|
| `src/types/User.ts` | Add `UserRole` type, update interfaces |
| `src/services/supabaseAuthNew.ts` | Import `UserRole`, update `AuthUser`, replace casts |
| `src/context/AuthContextNew.tsx` | Add `isBoard` state + expose in context |
| `src/App.tsx` | Rewrite `ProtectedRoute` with `allowedRoles`, per-route guards |
| `src/pages/admin/DashboardHome.tsx` | Filter cards by role, conditional text |
| `src/components/modern/ModernHeader.tsx` | Show Admin link + role chip for board |
| `src/pages/admin/UsersList.tsx` | Three-way role `Select` dropdown |
| `src/services/auth/adminConfig.ts` | Add board email auto-assignment support |
| `supabase/migrations/20260221_*.sql` | RLS policy for board on fault_reports |
