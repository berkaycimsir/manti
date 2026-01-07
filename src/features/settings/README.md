# Settings Feature

User and application settings for Manti.

## Overview

This feature handles user profile settings, security options, data storage preferences, and danger zone actions (account deletion, data reset).

## Components

- **ProfileTab** - User profile settings (name, email, avatar)
- **SecurityTab** - Password change, session management
- **DataStorageTab** - Data explorer for local storage and server data
- **DangerTab** - Account deletion, data reset options
- **SettingsLayout** - Layout wrapper for settings pages
- **SettingsSidebar** - Navigation sidebar for settings

## Hooks

- **useSettings** - Hook for managing user settings

## Usage

```tsx
import {
  SettingsLayout,
  ProfileTab,
  SecurityTab,
  useSettings,
} from "@features/settings";

function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  
  return (
    <SettingsLayout>
      <ProfileTab />
    </SettingsLayout>
  );
}
```

## Exports

All components and hooks are exported through the feature's `index.ts`.
