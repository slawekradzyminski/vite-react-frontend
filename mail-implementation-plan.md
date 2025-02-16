# Mail Sending Functionality Implementation Plan

## Overview
Implement mail sending functionality for registered users, integrating with the backend `/email` endpoint.

## 1. Navigation Structure Changes ✅
- ✅ Add a navigation menu component to improve site navigation
- ✅ Include links for:
  - Home
  - Products
  - Cart
  - Send Email
  - Profile/Account
  - Logout
- ✅ Hide mobile menu when logged out
- ✅ Add tests for navigation functionality

## 2. New Components and Pages
1. **Send Email Page**
   - Create `src/pages/email/index.tsx`
   - Protect route using existing `ProtectedRoute` component
   - Form for composing and sending emails:
     - To field (autocomplete with registered users)
     - Subject field
     - Message field (rich text editor)
   - Loading states and error handling
   - Success/error notifications using toast

2. **Email Form Component**
   - Create `src/components/email/EmailForm.tsx`
   - Form validation using zod
   - Loading state handling
   - Error message display
   - Success feedback

## 3. Types and Validators
1. **Types (`src/types/email.ts`)**
   ```typescript
   interface EmailDto {
     to: string;
     subject: string;
     message: string;
   }

   interface EmailFormData extends EmailDto {}

   interface EmailResponse {
     success: boolean;
     message: string;
   }
   ```

2. **Validators (`src/validators/email.ts`)**
   - Validation schema for email form:
     - To: required, valid email, must exist in system
     - Subject: required, min/max length
     - Message: required, min/max length
   - Error messages for validation failures

## 4. API Integration
1. **API Client (`src/lib/api.ts`)**
   - Add email-related functions:
     ```typescript
     email: {
       send: (data: EmailDto) => api.post<EmailResponse>('/email', data),
       getUsers: () => api.get<string[]>('/email/users'),
     }
     ```
   - Handle response status codes (200, 400, 401)
   - Add proper error handling

## 5. State Management
- Add email-related mutations using React Query:
  ```typescript
  const { mutate, isLoading } = useMutation({
    mutationFn: (data: EmailDto) => email.send(data),
    onSuccess: () => showSuccessToast(),
    onError: (error) => showErrorToast(error),
  });
  ```
- Add query for fetching users list
- Handle loading and error states
- Show success/error notifications using toast

## 6. Testing Strategy
1. **Email Form Component Tests**
   - Test form validation
   - Test form submission
   - Test loading states
   - Test error handling
   - Test success notifications

2. **API Integration Tests**
   - Test successful email sending
   - Test error handling
   - Test unauthorized scenarios

3. **E2E Tests**
   - Complete email sending flow
   - Error scenarios
   - Validation scenarios

## Implementation Order
1. ✅ Create navigation structure
2. Create email types and validators
3. Create email form component
4. Integrate API endpoint
5. Add tests for each component
6. Polish UI and UX
7. Final testing and bug fixes

## Technical Considerations
- Ensure proper error handling
- Implement loading states
- Add toast notifications for success/error feedback
- Implement proper form validation
- Ensure responsive design
- Handle unauthorized scenarios
- Validate recipient email exists in the system 