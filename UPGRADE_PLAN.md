# Dependency Upgrade Plan

## Recently Completed (Safe Updates)

### Security Fixes ✅
- **Vite**: 5.4.20 → 6.3.6 (Fixed esbuild security vulnerability)
- **@vitejs/plugin-react**: 4.2.1 → 5.0.3
- **eslint-plugin-react-hooks**: 4.6.2 → 5.2.0
- **eslint-plugin-react-refresh**: 0.4.20 → 0.4.21
- **@types/node**: 24.5.2 → 22.0.0 (downgraded to stable LTS)

**Status**: ✅ All working, tests pass, no vulnerabilities

## Future Major Upgrades (Requires Planning)

### High Priority - Breaking Changes Expected

#### React 19 Migration
- **Current**: react@18.3.1, react-dom@18.3.1
- **Target**: react@19.1.1, react-dom@19.1.1
- **Impact**: Major breaking changes, new features
- **Requirements**:
  - Update @types/react to 19.x
  - Review concurrent features usage
  - Test all components thoroughly
  - Update React DevTools

#### ESLint 9 Migration
- **Current**: eslint@8.57.1
- **Target**: eslint@9.36.0
- **Impact**: Flat config required, rule changes
- **Requirements**:
  - Migrate to flat config format
  - Update @typescript-eslint packages to 8.x
  - Review and update all ESLint rules
  - Test linting across entire codebase

#### Vite 7 Migration (Future)
- **Current**: vite@6.3.6
- **Target**: vite@7.1.7
- **Impact**: Node.js 18+ requirement, API changes
- **Requirements**:
  - Review build configuration
  - Update Vitest compatibility
  - Test all Vite plugins

### Medium Priority

#### TypeScript Updates
- **Current**: typescript@5.2.2
- **Target**: typescript@5.7.x (latest stable)
- **Impact**: New language features, stricter checking

### Low Priority - Patch Updates
- Various minor version updates for dependencies
- Regular maintenance updates

## Upgrade Strategy

### Phase 1: ✅ Completed
Security fixes and compatible minor updates

### Phase 2: React 19 (Future)
- Plan comprehensive testing
- Review breaking changes documentation
- Create feature branch for testing
- Staged rollout with thorough QA

### Phase 3: ESLint 9 (Future)
- After React 19 stabilization
- Dedicated migration sprint
- Configuration modernization

### Phase 4: Vite 7 (Future)
- After React and ESLint migrations
- Full build system review
- Performance optimization opportunity

## Notes
- Prioritize security and stability over latest features
- Each major upgrade should be isolated and thoroughly tested
- Consider LTS versions for critical dependencies
- Monitor community adoption before major migrations