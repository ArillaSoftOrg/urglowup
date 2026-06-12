#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dictionariesDir = path.join(__dirname, '../src/dictionaries')

async function checkDictionaries() {
  const files = await fs.readdir(dictionariesDir)
  const localeFiles = files.filter(f => f.endsWith('.ts') && f !== 'index.ts')

  if (localeFiles.length === 0) {
    console.error('No dictionary files found')
    process.exit(1)
  }

  // Validate all files can be read
  for (const file of localeFiles) {
    try {
      await fs.readFile(path.join(dictionariesDir, file), 'utf-8')
    } catch (err) {
      console.error(`✗ Failed to read ${file}: ${err.message}`)
      process.exit(1)
    }
  }

  // Dynamically import to check shape parity
  console.log('Checking dictionary shape parity...')

  try {
    // Load the Turkish dictionary as the canonical source
    const trPath = path.join(dictionariesDir, 'tr.ts')
    const trContent = await fs.readFile(trPath, 'utf-8')

    // Extract top-level keys from tr.ts by looking for comma-separated keys followed by colons
    const keyMatches = trContent.match(/^\s+(\w+):\s*{/gm)
    const expectedKeys = keyMatches ? keyMatches.map(m => m.trim().split(':')[0]) : []

    if (expectedKeys.length === 0) {
      console.error('Could not extract dictionary structure from tr.ts')
      process.exit(1)
    }

    console.log(`✓ Found ${expectedKeys.length} top-level keys in tr.ts: ${expectedKeys.join(', ')}`)

    // Check that all other dictionaries have the same top-level keys
    let hasErrors = false
    for (const file of localeFiles) {
      if (file === 'tr.ts') continue

      const locale = file.replace('.ts', '')
      const filePath = path.join(dictionariesDir, file)
      const content = await fs.readFile(filePath, 'utf-8')

      const localeKeyMatches = content.match(/^\s+(\w+):\s*{/gm)
      const localeKeys = localeKeyMatches ? localeKeyMatches.map(m => m.trim().split(':')[0]) : []

      // Simple check: expected keys must all be present
      const missingKeys = expectedKeys.filter(k => !localeKeys.includes(k))
      const extraKeys = localeKeys.filter(k => !expectedKeys.includes(k))

      if (missingKeys.length > 0 || extraKeys.length > 0) {
        console.error(`✗ ${locale}.ts: key mismatch`)
        if (missingKeys.length > 0) {
          console.error(`  Missing: ${missingKeys.join(', ')}`)
        }
        if (extraKeys.length > 0) {
          console.error(`  Extra: ${extraKeys.join(', ')}`)
        }
        hasErrors = true
      } else {
        console.log(`✓ ${locale}.ts: shape matches`)
      }
    }

    if (hasErrors) {
      process.exit(1)
    }

    console.log('\n✓ All dictionaries have matching shapes!')
  } catch (err) {
    console.error(`Error during validation: ${err.message}`)
    process.exit(1)
  }
}

checkDictionaries()
