/**
 * Reset VAPI - Delete all squads and assistants, then recreate
 * Run with: pnpm --filter @repo/api reset-vapi
 */

import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local from api directory
dotenv.config({ path: join(__dirname, '..', '.env.local') })
import { deleteAllVapiResources, createEricaBrownPftSquad } from '../src/scheduling/squad-manager'

async function main() {
  console.log('=== VAPI Reset Script ===\n')

  // Step 1: Delete all existing resources
  console.log('Step 1: Deleting all VAPI resources...\n')
  const { squadsDeleted, assistantsDeleted } = await deleteAllVapiResources()
  console.log(`\nDeleted ${squadsDeleted} squads, ${assistantsDeleted} assistants\n`)

  // Step 2: Recreate squads
  console.log('Step 2: Creating squads...\n')

  // Create Erica Brown PFT squad
  console.log('Creating Erica Brown PFT squad...')
  const ericaSquad = await createEricaBrownPftSquad()
  console.log(`✓ Created Erica Brown PFT squad: ${ericaSquad.squadId}\n`)

  // Add more squads here as needed:
  // const lunaSquad = await createAgentSquad({ name: 'Luna Confirmation', ... })

  console.log('=== VAPI Reset Complete ===')
}

main().catch(console.error)
