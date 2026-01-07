# Auth Feature

Authentication feature for Manti using Better-Auth.

## Overview

This feature handles user authentication including sign-in, sign-up, and session management.

## Components

- **SignInForm** - Email/password sign-in form with social login options
- **SignUpForm** - New user registration form

## Hooks

- **useAuth** - Hook for accessing authentication state and methods

## Usage

```tsx
import { SignInForm, SignUpForm, useAuth } from "@features/auth";

// In a sign-in page
export default function SignInPage() {
  return <SignInForm />;
}

// Check auth state
function ProtectedComponent() {
  const { session, isLoading, signOut } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!session) return <Redirect to="/sign-in" />;
  
  return <div>Welcome, {session.user.name}</div>;
}
```

## Exports

```typescript
export * from "./components/sign-in-form";
export * from "./components/sign-up-form";
export * from "./hooks/use-auth";
export * from "./lib/auth-client";
```
