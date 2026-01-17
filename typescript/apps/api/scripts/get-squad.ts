/**
 * Get VAPI squad configuration
 * Run with: npx tsx scripts/get-squad.ts
 */

import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { VapiClient } from '@vapi-ai/server-sdk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY! })

async function main() {
  // List all squads
  const squads = await vapiClient.squads.list()
  
  // Find pft-outbound
  const pftSquad = squads.find(s => s.name?.toLowerCase().includes('pft'))
  
  if (pftSquad) {
    console.log('=== PFT Squad Found ===')
    console.log(JSON.stringify(pftSquad, null, 2))
    
    // Also get the member assistants
    console.log('\n=== Member Assistants ===')
    for (const member of pftSquad.members || []) {
      if (member.assistantId) {
        try {
          const assistant = await vapiClient.assistants.get({ id: member.assistantId })
          console.log(`\n--- ${assistant.name} (${assistant.id}) ---`)
          console.log(JSON.stringify(assistant, null, 2))
        } catch (e) {
          console.log(`Could not fetch assistant ${member.assistantId}`)
        }
      }
    }
  } else {
    console.log('No PFT squad found. Available squads:')
    for (const squad of squads) {
      console.log(`  - ${squad.name} (${squad.id})`)
    }
  }
}

main().catch(console.error)
