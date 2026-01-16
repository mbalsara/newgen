/**
 * Extended VAPI types for features not yet in the SDK
 * The VAPI SDK types are sometimes behind the actual API capabilities
 */

import type { Vapi } from '@vapi-ai/server-sdk'

// Transfer destinations include 'dynamic' type not in SDK
export interface TransferDestinationDynamic {
  type: 'dynamic'
  server: {
    url: string
  }
}

export type ExtendedTransferDestination =
  | Vapi.TransferDestinationAssistant
  | Vapi.TransferDestinationNumber
  | Vapi.TransferDestinationSip
  | TransferDestinationDynamic

// TransferCall tool can have function definition (not in SDK types)
export interface TransferCallToolWithFunction {
  type: 'transferCall'
  function: {
    name: string
    description: string
    parameters?: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
  destinations: ExtendedTransferDestination[]
  messages?: Vapi.CreateTransferCallToolDtoMessagesItem[]
}

// Function tool type for server-side tools
export interface ServerFunctionTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
  server: {
    url: string
  }
  messages?: Array<{
    type: 'request-start' | 'request-complete' | 'request-failed'
    content: string
  }>
}

// Combined tool type
export type ExtendedTool = ServerFunctionTool | TransferCallToolWithFunction

// Model config that accepts extended tools
export interface ExtendedModelConfig {
  provider: 'openai' | 'anthropic' | 'google'
  model: string
  messages: Array<{
    role: 'system' | 'assistant' | 'user'
    content: string
  }>
  tools?: ExtendedTool[]
}
