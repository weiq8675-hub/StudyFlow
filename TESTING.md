# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

- **Vitest** — Fast, Vite-native test runner
- **React Testing Library** — DOM testing utilities
- **@testing-library/jest-dom** — Custom Jest matchers

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

## Test Layers

### Unit Tests
- **What:** Pure functions, store logic, utility functions
- **Where:** `src/**/*.test.ts`
- **When:** Test every new function, store, or utility

### Component Tests
- **What:** React components, user interactions
- **Where:** `src/**/*.test.tsx`
- **When:** Test critical UI flows, form validation, state changes

### Integration Tests
- **What:** Store + DB interactions, multi-component flows
- **Where:** `src/**/*.integration.test.ts`
- **When:** Test data persistence, cross-cutting concerns

## Conventions

### File Naming
- Unit tests: `filename.test.ts`
- Component tests: `ComponentName.test.tsx`
- Integration tests: `feature.integration.test.ts`

### Assertion Style
```typescript
// Prefer explicit assertions
expect(result).toHaveLength(1);
expect(result[0].title).toBe('Expected Title');

// Avoid vague assertions
expect(result).toBeDefined(); // ❌ Too weak
```

### Test Structure
```typescript
describe('feature name', () => {
  beforeEach(() => {
    // Reset state
  });

  it('does something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Current Coverage

| Area | Files | Status |
|------|-------|--------|
| Stores | homeworkStore, pointsStore | ✅ Tested |
| Components | — | 📝 TODO |
| Pages | — | 📝 TODO |

## Test Health

- Total test files: 2
- Total tests: 12
- Coverage: Run `npm run test:coverage` to see current coverage
