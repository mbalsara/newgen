/**
 * Enable structuredDataMultiPlan for squad assistants
 *
 * This allows aggregating structured data from all squad members
 * into call.analysis.structuredDataMulti
 *
 * Run with: npx tsx scripts/enable-multi-plan.ts
 */

import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { VapiClient } from '@vapi-ai/server-sdk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local from api directory
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY! })

// Assistant IDs to update
const ASSISTANTS = {
  'pft-main': '433affd6-68b3-48d5-b094-2341bf367b0f',
  'scheduler': '298bf4c1-7e35-4b7f-90b3-01e4a9c397ee',
}

async function enableMultiPlan() {
  console.log('Enabling structuredDataMultiPlan for squad assistants...\n')

  for (const [name, id] of Object.entries(ASSISTANTS)) {
    try {
      // Get current assistant config
      const assistant = await vapiClient.assistants.get({ id })
      console.log(`[${name}] Current analysisPlan:`, JSON.stringify(assistant.analysisPlan, null, 2))

      // structuredDataMultiPlan just needs keys - schemas are in structured outputs
      // Keys are identifiers for the aggregated output
      let structuredDataMultiPlan: any[] = []

      if (name === 'pft-main') {
        structuredDataMultiPlan = [
          { key: 'pft_main_data' }
        ]
      } else if (name === 'scheduler') {
        structuredDataMultiPlan = [
          { key: 'scheduler_data' }
        ]
      }

      const updatedAnalysisPlan = {
        ...assistant.analysisPlan,
        structuredDataMultiPlan,
      }

      await vapiClient.assistants.update({
        id,
        analysisPlan: updatedAnalysisPlan,
      })

      console.log(`[${name}] Updated analysisPlan with structuredDataMultiPlan: enabled`)

      // Verify
      const updated = await vapiClient.assistants.get({ id })
      console.log(`[${name}] New analysisPlan:`, JSON.stringify(updated.analysisPlan, null, 2))
      console.log()
    } catch (error) {
      console.error(`[${name}] Error:`, error)
    }
  }

  console.log('Done!')
}

enableMultiPlan().catch(console.error)
