## Environment Setup and Debugging

This rule defines environment setup and debugging practices.

### Development Environment
- Frontend dev server: `http://localhost:8081`
- Backend service: `http://localhost:4001`
- Database: H2 in-memory database

### Backend Services
Available endpoints:
- API Documentation: `http://localhost:4001/v3/api-docs`
- Swagger UI: `http://localhost:4001/swagger-ui/index.html`
- H2 Console: `http://localhost:4001/h2-console`

### Docker Setup
```bash
# Start backend
docker compose up -d

# View logs
docker ps
docker logs <container-id>
```

### Common Issues

#### Authentication Issues (401)
- Check JWT token validity
- Verify token is included in requests
- Check token expiration

#### CORS Issues
- Verify request origin (default: http://localhost:8081)
- Check backend CORS configuration
- Verify request headers

#### API Errors
- Check backend logs for details
- Verify request payload
- Check network tab in browser

### Development Workflow
- Frontend changes are hot-reloaded
- Backend changes require container restart
- Database resets on container restart

### Available Scripts
```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build

# Testing
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run test:e2e:ai  # E2E tests (AI friendly)
``` 