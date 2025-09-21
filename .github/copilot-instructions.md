# Config UI - GitHub Copilot Instructions

Config UI is a React-based web application for managing configurations in the Map Colonies project. The application provides a web interface for creating, viewing, editing, and managing JSON configurations using schemas, with features like versioning, rollback, and diff visualization using Monaco Editor.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Build
- **Install dependencies**: `npm install` -- takes 35 seconds. NEVER CANCEL. Set timeout to 90+ seconds.
- **Build the application**: `npm run build` -- takes 45 seconds. NEVER CANCEL. Set timeout to 90+ seconds.
  - Runs TypeScript compilation followed by Vite build
  - May show linting warnings but still succeeds
  - Produces optimized production bundle in `dist/` directory
- **Run development server**: `npm run dev` -- starts in 2 seconds, runs on http://localhost:5173
- **Preview production build**: `npm run preview` -- serves built files on http://localhost:4173

### Code Quality and Validation
- **Lint code**: `npm run lint` -- takes 6 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
  - Currently has some existing linting warnings/errors that don't block builds
  - Uses ESLint with TypeScript and React-specific rules
  - Ignores auto-generated files in `src/api/client/**/*.ts`
- **Format check**: `npm run format` -- takes 2 seconds. Clean and passes.
- **Format fix**: `npm run format:fix` -- applies Prettier formatting
- **CRITICAL**: Always run `npm run format` and `npm run lint` before committing or the CI will fail

### Backend Dependencies
- **REQUIRED**: Config Server must be running on `localhost:8082` for full functionality
  - Repository: https://github.com/MapColonies/config-server
  - The app will show "Internal Server Error" without the backend
  - Proxy configuration in `vite.config.ts` routes `/api` calls to `http://localhost:8082`
- **Frontend-only testing**: The UI loads and navigation works without backend, but data operations fail

## Validation Scenarios

### Manual Testing Requirements
**ALWAYS manually validate changes by running through these complete scenarios after making modifications:**

1. **Application Startup Validation**:
   - Run `npm run dev`
   - Navigate to http://localhost:5173
   - Verify the sidebar shows "Configs" and "Schemas" navigation
   - Without backend: expect "Internal Server Error" message (this is normal)

2. **Build and Preview Validation**:
   - Run `npm run build` (wait full 45 seconds)
   - Run `npm run preview`
   - Navigate to http://localhost:4173
   - Verify application loads with same functionality as dev mode

3. **Navigation Testing**:
   - Test clicking between "Configs" and "Schemas" sections
   - Verify routing works correctly (URLs change appropriately)
   - Check browser console for JavaScript errors

4. **Code Quality Validation**:
   - Run `npm run lint` and `npm run format`
   - Address any new linting errors you introduce (existing ones are acceptable)
   - Ensure no new TypeScript compilation errors

### With Backend Server (Full Validation)
If Config Server is available, also test:
- View configurations table
- Create new configurations using JSON schemas
- Edit existing configurations with Monaco editor
- Test schema validation and diff functionality

## Repository Structure

### Key Files and Directories
```
├── src/
│   ├── pages/           # Main application pages (configs, schemas, createConfig)
│   ├── components/      # Reusable React components
│   ├── api/             # API client and services
│   │   ├── client/      # Auto-generated OpenAPI client (DO NOT EDIT)
│   │   └── services/    # API service layer
│   ├── routing/         # React Router configuration
│   ├── context/         # React context providers
│   └── utils/           # Utility functions
├── .github/
│   └── workflows/       # CI/CD pipelines
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration and proxy setup
├── tsconfig.json        # TypeScript configuration
└── .eslintrc.cjs        # ESLint configuration
```

### Important Development Files
- **vite.config.ts**: Contains proxy configuration for backend API calls
- **src/api/api.ts**: Base API configuration (`CONFIG_SERVER_BASE_URL = '/api'`)
- **src/routing/routes.ts**: Application route definitions
- **src/main.tsx**: Application entry point
- **src/App.tsx**: Main app component with Monaco Editor setup

## Common Tasks

### Development Workflow
1. **Start development**: `npm install && npm run dev`
2. **Make changes**: Edit files in `src/`
3. **Validate changes**: `npm run lint && npm run format`
4. **Test manually**: Navigate through UI to verify functionality
5. **Build for production**: `npm run build`

### API Client Regeneration
- Auto-generated client files in `src/api/client/` should not be manually edited
- Uses `@hey-api/openapi-ts` for generation
- Regenerate with backend OpenAPI schema when API changes

### Troubleshooting Common Issues
- **"Internal Server Error"**: Normal without Config Server backend running
- **Proxy errors in console**: Expected when Config Server is not available
- **TypeScript version warning**: Can be ignored, build still works
- **Large bundle warning**: Expected due to Monaco Editor, can be ignored
- **Build fails**: Check for TypeScript errors, run `npm run lint` for details

## Technology Stack
- **React 18**: UI framework
- **TypeScript**: Type safety and development experience  
- **Vite**: Build tool and development server
- **Monaco Editor**: Code editor for JSON configuration editing
- **Material-UI (MUI)**: Component library for UI
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **AJV**: JSON schema validation
- **Zod**: Runtime type validation

## CI/CD Pipeline
- **Pull Request**: Runs linting (ESLint + Prettier) on Node 20.x and 22.x
- **Release**: Automated release on tag push using shared MapColonies workflow
- **Git Hooks**: 
  - Pre-commit: Runs `pretty-quick --staged` for formatting
  - Commit-msg: Validates conventional commit format

## Development Environment
- **Node.js**: Compatible with versions 20.x and 22.x
- **Package Manager**: npm (uses package-lock.json)
- **Editor**: VS Code recommended (extensions config in .vscode/)
- **Code Style**: Prettier with MapColonies configuration
- **Commit Style**: Conventional commits with scope validation (deps, configurations)

## NEVER DO
- **Do not cancel builds**: They take 45+ seconds normally
- **Do not edit auto-generated files**: Files in `src/api/client/` are auto-generated
- **Do not ignore linting failures you introduce**: Fix new linting errors
- **Do not commit without validation**: Always run format and lint checks
- **Do not modify timeouts below**: Build: 90s, Lint: 30s, Install: 90s