# Users Page Update Implementation Plan

## Changes Overview
1. Replace Profile link with Users in navigation menu
2. Update navigation tests to reflect the changes
3. Verify and fix users page functionality

## Implementation Phases

### Phase 1: Navigation Updates
- Update `Navigation.tsx` to:
  - Replace Profile with Users in menu items
  - Ensure Users menu item is only visible for admin users
  - Update mobile menu to include Users instead of Profile
- Update navigation tests to:
  - Remove Profile link tests
  - Add Users link tests
  - Verify mobile menu includes Users for admin users
  - Verify Users link is not visible for non-admin users

Example test updates:
```typescript
// Navigation.test.tsx
it('should show Users link when user is admin', async () => {
  // given
  renderWithProviders(<Navigation />);
  
  // when
  mockAdminUser();
  
  // then
  expect(screen.getByText('Users')).toBeInTheDocument();
});

it('should not show Users link for non-admin users', async () => {
  // given
  renderWithProviders(<Navigation />);
  mockRegularUser();
  
  // then
  expect(screen.queryByText('Users')).not.toBeInTheDocument();
});

it('should navigate to users page when clicking Users link', async () => {
  // given
  renderWithProviders(<Navigation />);
  mockAdminUser();
  
  // when
  await userEvent.click(screen.getByText('Users'));
  
  // then
  expect(window.location.pathname).toBe('/users');
});
```

### Phase 2: Users Page Verification
- Test user management functionality:
  - View users list
  - Edit user
  - Delete user
- Add missing tests for users page
- Fix any issues found

Example test structure:
```typescript
// users.test.tsx
describe('UsersPage', () => {
  // given
  it('should render users list', async () => {
    // when
    renderWithProviders(<UsersPage />);
    
    // then
    expect(await screen.findByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  // given
  it('should allow admin to edit user', async () => {
    // when
    renderWithProviders(<UsersPage />);
    mockAdminUser();
    
    // then
    expect(screen.getByRole('button', { name: /edit/i })).toBeEnabled();
  });

  // given
  it('should allow admin to delete user', async () => {
    // when
    renderWithProviders(<UsersPage />);
    mockAdminUser();
    
    // then
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  // given
  it('should not show edit/delete buttons for non-admin users', async () => {
    // when
    renderWithProviders(<UsersPage />);
    mockRegularUser();
    
    // then
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
```

### Phase 3: E2E Tests
Add E2E tests to verify the complete user management flow:

```typescript
// e2e/users.spec.ts
test.describe('Users Management', () => {
  test('admin should be able to view and manage users', async ({ page }) => {
    // given
    await loginAsAdmin(page);
    
    // when - view users
    await page.getByText('Users').click();
    
    // then
    await expect(page).toHaveURL('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    
    // when - edit user
    await page.getByRole('button', { name: 'Edit' }).first().click();
    
    // then
    await expect(page).toHaveURL(/\/users\/.*\/edit/);
    
    // when - delete user
    await page.goBack();
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // then
    await expect(page.getByText('User deleted successfully')).toBeVisible();
  });

  test('regular user should not see Users link', async ({ page }) => {
    // given
    await loginAsUser(page);
    
    // then
    await expect(page.getByText('Users')).not.toBeVisible();
  });
});
```

### Test Coverage Requirements

#### Unit Tests
- Navigation component
  - Users link visibility for admin
  - Users link hidden for non-admin
  - Users link navigation
  - Mobile menu integration
- Users page
  - Loading state
  - Error handling
  - Admin functionality
  - Regular user restrictions

#### E2E Tests
- Complete user management flow
  - View users
  - Edit user
  - Delete user
  - Permission checks
  - Navigation visibility

### Implementation Order
1. Update navigation menu items
2. Add/update navigation tests
3. Verify users page functionality
4. Add missing users page tests
5. Add E2E tests
6. Fix any issues found during testing

### Success Criteria
- All unit tests pass
- All E2E tests pass
- Admin can manage users
- Regular users have appropriate restrictions
- Navigation is intuitive and working
- Users link is only visible to admin users 