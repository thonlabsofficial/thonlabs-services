# @thon-labs-services/typescript-config

Shared TypeScript configuration for the ThonLabs monorepo.

## Available Configs

- `base.json` - Base TypeScript configuration for Node.js projects
- `react-library.json` - TypeScript configuration for React libraries (extends base)

## Usage

In your `tsconfig.json`:

```json
{
  "extends": "@thon-labs-services/typescript-config/base.json"
}
```

Or for React libraries:

```json
{
  "extends": "@thon-labs-services/typescript-config/react-library.json"
}
```
