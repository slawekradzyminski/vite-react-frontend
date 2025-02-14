## Testing Patterns

This rule applies to all test files in the project.

### File Patterns
- `**/*.test.tsx`
- `**/*.test.ts`
- `e2e/*.spec.ts`

### Testing Structure
Always follow the given/when/then pattern in test comments:

```typescript
// given - setup test data and conditions
// when - execute the action being tested
// then - verify the expected outcomes
```

### Unit Tests (Vitest)
- Co-locate test files with the components they test
- Use React Testing Library for component testing
- Mock external dependencies (axios, etc.)
- Test files should follow the naming pattern: `ComponentName.test.tsx`

Example structure:
```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  // given
  it('should render successfully', () => {
    // when
    render(<Component />);
    
    // then
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)
- Place all E2E tests in the `e2e/` directory
- Test complete user journeys
- Use page objects when possible
- Test against real backend service
- File naming pattern: `featureName.spec.ts`

Example structure:
```typescript
import { test, expect } from '@playwright/test';

test('feature workflow', async ({ page }) => {
  // given
  await page.goto('/path');
  
  // when
  await page.getByRole('button').click();
  
  // then
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Test Commands
Unit Tests:
```bash
npm run test        # Run once
npm run test:watch  # Watch mode
npm run test:ui     # UI mode
npm run test:coverage # Coverage report
```

E2E Tests:
```bash
npm run test:e2e     # Run e2e tests
npm run test:e2e:ai  # List reporter (AI friendly)
npm run test:e2e:ui  # UI mode
npm run test:e2e:debug # Debug mode
``` 