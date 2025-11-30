# @dty/ai-assistant-core

Core AI Assistant library with dependency injection support.

## Features

- Provider-agnostic AI model configuration
- Dependency injection for context, file system, and i18n providers
- Tool system with abstract interfaces
- Type-safe tool definitions

## Installation

```bash
pnpm add @dty/ai-assistant-core
```

## Usage

### Basic Setup

```typescript
import { createAITools, getAIModel } from "@dty/ai-assistant-core";
import { GitaryContextProvider } from "./adapters/gitary-context-provider";
import { GitaryFileSystemProvider } from "./adapters/gitary-file-system-provider";

const contextProvider = new GitaryContextProvider();
const fileSystemProvider = new GitaryFileSystemProvider();

const toolContext = {
  fileSystem: fileSystemProvider,
  contextProvider: contextProvider,
};

const tools = createAITools(toolDefinitions, toolContext);
const model = getAIModel("openai", providerConfigs);
```

## License

MIT

