# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Build all packages
- `npm run build:all` - Build all packages including sandbox
- `npm run build:packages` - Build only workspace packages
- `npm run bundle` - Generate bundle after building
- `npm start` - Start the CLI application
- `npm run debug` - Start with debugging enabled

### Testing
**IMPORTANT**: Build packages before running tests: `npm run build:packages`

- `npm test` - Run tests for all packages
- `npm run test:ci` - Run tests with coverage for CI
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:integration:all` - Run all integration tests
- `npm run test:integration:sandbox:none` - Run integration tests without sandbox
- `npm run test:integration:sandbox:docker` - Run integration tests with Docker sandbox
- `npm run test:integration:sandbox:podman` - Run integration tests with Podman sandbox

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run lint:ci` - Run linting for CI (no warnings allowed)
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking

### Cleanup and Maintenance
- `npm run clean` - Clean build artifacts
- `npm run preflight` - Complete build and test pipeline

### Version Information
- `gemini --version` - Show version number only
- `gemini --build-info` - Show detailed build information with timestamp, git commit, platform
- Build info automatically generated at build time by `scripts/generate-build-info.js`

## Architecture Overview

The Gemini CLI is structured as a monorepo with two main packages:

### Core Packages
1. **CLI Package (`packages/cli/`)** - User-facing terminal interface
   - Input processing and command handling
   - UI components built with React/Ink
   - Theme management and display rendering
   - Authentication flows and configuration
   - History management and editor integration

2. **Core Package (`packages/core/`)** - Backend functionality
   - Gemini API client and communication
   - Tool registration and execution system
   - Prompt construction and conversation management
   - File system operations, shell commands, web fetching
   - Telemetry and monitoring capabilities

### Key Design Patterns
- **Modular Tool System**: Tools are individual modules in `packages/core/src/tools/` that extend model capabilities
- **React-based CLI**: Uses Ink framework for rich terminal UI components
- **Workspace Architecture**: Monorepo structure with shared dependencies and coordinated builds
- **Security Model**: User confirmation required for file system modifications and shell commands

## Development Environment

### Prerequisites
- Node.js version 20 or higher
- npm workspaces support

### Authentication Setup
The CLI supports multiple authentication methods:
- Personal Google account (default: 60 requests/min, 1000/day)
- Gemini API key: Set `GEMINI_API_KEY` environment variable
- Vertex AI API key: Set `GOOGLE_API_KEY` and `GOOGLE_GENAI_USE_VERTEXAI=true`

### Sandbox Configuration
Sandbox mode supports Docker and Podman for isolated execution. Configure via `GEMINI_SANDBOX` environment variable.

## Important Files and Directories

### Configuration
- `packages/cli/src/config/` - CLI configuration management
- `packages/core/src/config/` - Core configuration and model settings
- `esbuild.config.js` - Build configuration
- `tsconfig.json` - TypeScript configuration

### Core Functionality
- `packages/core/src/tools/` - All available tools (file operations, shell, web, etc.)
- `packages/core/src/core/` - Main chat and API interaction logic
- `packages/cli/src/ui/` - React components for terminal interface
- `packages/cli/src/hooks/` - Custom React hooks for CLI functionality

### Build System
- `scripts/build.js` - Main build orchestration
- `scripts/build_package.js` - Individual package building
- `scripts/bundle.js` - Bundle creation for distribution

## Recent Improvements

### Edit Tool Error Handling Enhancements (2025-01)

#### Phase 1: Enhanced Error Messages
- **Improved Error Messages**: Clear "EDIT TOOL FAILED" indicators with specific guidance
- **System Prompt Enhancement**: Added explicit tool failure handling instructions
- **Multiple Match Detection**: Provides exact match counts and resolution options
- **Mandatory Next Steps**: Forces diagnostic steps before retry attempts

#### Phase 2: Structured Error Handling & Retry Prevention
- **Enhanced ToolResult Interface**: Added `success` flags and `errorInfo` structured data
- **Tool Execution Validator**: Prevents immediate retries of identical failed operations
- **Structured Error Codes**: Categorized errors (validation, execution, permission, not_found, conflict)
- **Retry Loop Prevention**: 30-second timeout before allowing identical tool retry
- **Diagnostic Action Detection**: Automatically detects when diagnostic tools are used

**Key Changes:**
- `packages/core/src/tools/tools.ts` - Enhanced ToolResult interface with success flags
- `packages/core/src/tools/edit.ts` - Structured error information and success reporting
- `packages/core/src/utils/toolExecutionValidator.ts` - Retry prevention system
- `packages/core/src/core/coreToolScheduler.ts` - Integrated validation and tracking
- `packages/core/src/core/prompts.ts` - Tool failure handling guidance

**Testing**: Use ambiguous edits to verify proper error handling and retry prevention.