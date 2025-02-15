# Code Style Rules

## Styling
- CSS should be kept in separate `.css` files, not in inline Tailwind classes
- Use CSS modules for component-specific styles
- Follow BEM naming convention for CSS classes
- Avoid inline styles unless absolutely necessary for dynamic values

## JavaScript/TypeScript
- Use modern syntax (import/export)
- Avoid unnecessary comments explaining obvious code
- Place TypeScript types in `/types` folder
- Follow given/when/then pattern in test comments

## AI Agent Behavior

This rule defines how the AI agent should behave when making changes to the codebase.

### After Code Changes
After any batch of code changes, ALWAYS:
1. Run unit tests: `npm test`
2. Run E2E tests: `npm run test:e2e:ai`

### Test Output Processing
- Use list reporter output to analyze test results
- Fix any failing tests before proceeding
- If tests fail, analyze the error messages and fix the issues

### Change Validation
Before completing any task:
1. Ensure all unit tests pass
2. Verify E2E tests pass
3. Fix any test failures before moving to the next task
4. Report test results to the user

### Error Handling
If tests fail:
1. Analyze the error messages
2. Propose fixes for failing tests
3. Apply fixes
4. Re-run tests to verify fixes

### Test Commands Reference
```bash
# Always run both:
npm test            # Run unit tests
npm run test:e2e:ai # Run E2E tests with AI-friendly output
``` 
Iterate if needed.

1. **Backend Communication**
   - The backend container logs can be accessed using:
     ```bash
     docker ps # to get the container ID
     docker logs <container-id>
     ```
   - Monitor the logs for request/response details and error messages

2. **API Documentation**
   - Always refer to the OpenAPI documentation at `http://localhost:4001/v3/api-docs`
   - Use Swagger UI for interactive API testing
   - Check the backend source code in `backend.md` for implementation details

3. Test failures may be caused by recent changes since git HEAD is kept stable. To see the changes use:
   ```bash
   git --no-pager diff
   ```