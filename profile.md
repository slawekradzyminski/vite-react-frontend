# Profile Page Implementation Plan

Below is an outline for implementing the new Profile page. The plan is broken into logical steps for clarity, including references to existing code where relevant.

## 1. Create the Profile Page

### Create profile.tsx in src/pages/profile/
- Location: `src/pages/profile/index.tsx` (or `profile.tsx` depending on your preference)
- This page will render:
  - System Prompt Form: Allows the user to view and edit their system prompt
  - User Edit Form: Reuse the same logic from `src/pages/edit-user.tsx` or a shared component
  - Order History: Displays a list of the user's past orders

### Add Route to AppRoutes.tsx
- Import the Profile component
- Define a route, for example:
```tsx
{
  path: '/profile',
  element: <ProtectedRoute><Profile /></ProtectedRoute>,
}
```
- Ensure only authenticated users can access this route (hence wrapping with `<ProtectedRoute />`)

### Navigation Link
- In `src/components/layout/Navigation.tsx` (or wherever the main navigation is defined), add a link to `/profile`. For example:
```tsx
<NavLink to="/profile">Profile</NavLink>
```
- This gives users an easy way to navigate to the new page

## 2. Fetch and Update System Prompt

### Create an API Wrapper Function
- In `src/lib/api.ts`, add functions to get and update the system prompt:
```ts
export async function getSystemPrompt(username: string): Promise<SystemPromptDto> {
  const { data } = await apiClient.get(`/users/${username}/system-prompt`);
  return data;
}

export async function updateSystemPrompt(username: string, systemPrompt: string): Promise<SystemPromptDto> {
  const { data } = await apiClient.put(`/users/${username}/system-prompt`, { systemPrompt });
  return data;
}
```
- These endpoints correspond to:
  - GET `/users/{username}/system-prompt`
  - PUT `/users/{username}/system-prompt`

### Integrate in Profile Page
- In `profile.tsx`, you can fetch the current user's data by calling a `whoAmI()` or reading from context if already stored. Let's assume you already have the username.
- Add local state for `systemPrompt`
- On component mount (using `useEffect`), call `getSystemPrompt(username)` and store it in state
- Provide a small form for editing:
```tsx
<form onSubmit={handleSystemPromptSubmit}>
  <label>System Prompt</label>
  <textarea
    value={systemPrompt}
    onChange={e => setSystemPrompt(e.target.value)}
  />
  <button type="submit">Save</button>
</form>
```
- `handleSystemPromptSubmit` calls `updateSystemPrompt(username, systemPrompt)`

### Unit Test
- Create `profile.test.tsx` in `src/pages/profile/`
- Verify that:
  - The system prompt text area is displayed
  - `getSystemPrompt` is called on mount
  - Submitting updates the system prompt (mock the API, ensure the PUT call is triggered)

## 3. Integrate User Edit Form

### Reuse Existing Edit User Logic
- We have `src/pages/edit-user.tsx` which presumably handles editing user details
- Extract the edit form logic into a shared component if needed, for example:
```tsx
// src/components/user/UserEditForm.tsx
export function UserEditForm({ user, onSave }) {
  // form logic for editing user
  // calls onSave when user clicks "Update"
}
```

### Import and Use in Profile
- In `profile.tsx`, fetch current user from GET `/users/me` or from existing global store/context
- Render the `UserEditForm` with the current user's data. For example:
```tsx
<UserEditForm
  user={currentUser}
  onSave={handleSaveUser}
/>
```
- `handleSaveUser` calls the existing update logic (PUT `/users/{username}`) from `src/lib/api.ts`

### Unit Test
- In `profile.test.tsx` or a separate test file, verify that:
  - The user edit form is displayed with the correct user info
  - Submitting the form calls the correct API

## 4. Display Order History

### Create an API Wrapper for Orders
- In `src/lib/api.ts`, add:
```ts
export async function getUserOrders(
  page: number = 0,
  size: number = 10,
  status?: string
): Promise<PageDtoOrderDto> {
  const { data } = await apiClient.get('/api/orders', {
    params: { page, size, status },
  });
  return data;
}
```
- This corresponds to GET `/api/orders` which returns paginated user orders

### Render Orders in Profile
- In `profile.tsx`, fetch orders (e.g., in a `useEffect`), store them in state
- Display them in a table or card list:
```tsx
const [orders, setOrders] = useState<OrderDto[]>([]);
useEffect(() => {
  getUserOrders().then(response => setOrders(response.content));
}, []);

return (
  <div>
    {orders.map(order => (
      <div key={order.id}>
        <p>Order #{order.id}</p>
        <p>Status: {order.status}</p>
        <p>Total: {order.totalAmount}</p>
        {/* etc. */}
      </div>
    ))}
  </div>
);
```

### Optional Pagination
- If you want pagination, include page and size controls. Call `getUserOrders(page, size)` on user interaction

### Unit Test
- In `profile.test.tsx`, verify that:
  - Orders are fetched on mount (mock `getUserOrders`)
  - The results are rendered correctly (check for order data)

## 5. End-to-End Tests with Playwright

### Add a New Spec
- In `e2e/profile.spec.ts` (create a new file), write tests to verify user flows:
  - System Prompt Update:
    - Login as a user
    - Navigate to `/profile`
    - Check if the current system prompt is displayed
    - Update the text area and click "Save"
    - Assert success message or updated prompt on the UI
  - User Edit:
    - Update some user field (like firstName)
    - Click "Update"
    - Assert that the changes persist (e.g., check a success notification, then reload)
  - Order History:
    - Ensure existing orders are listed
    - Possibly check pagination or any relevant detail

### Run the Tests
- Use `npx playwright test e2e/profile.spec.ts` (or the appropriate script in `package.json`)
- Ensure the backend is running or use the mocks if needed

## 6. Final Checks

### Lint and Format
- Run `npm run lint` and `npm run format` (or the scripts defined in `package.json`) to ensure consistent code quality

### CI Integration
- If `.github/workflows/ci.yml` runs tests automatically, confirm that the new tests are included

### Documentation
- Update `README.md` or relevant docs with details about the Profile page and how it interacts with the backend