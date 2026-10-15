import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

config()

const prisma = new PrismaClient()
const root = path.dirname(fileURLToPath(import.meta.url))
const contentFile = path.join(root, '..', 'data', 'content.json')

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@ruxin.local').trim().toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-now'
  const name = process.env.SEED_ADMIN_NAME || 'Admin'

  if (password.length < 10) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters.')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ADMIN },
    create: { email, name, passwordHash, role: Role.ADMIN },
  })

  const existing = await prisma.siteDocument.findUnique({ where: { id: 'main' } })
  if (!existing) {
    const content = JSON.parse(readFileSync(contentFile, 'utf8'))
    await prisma.siteDocument.create({
      data: { id: 'main', content },
    })
    console.log('Seeded SiteDocument from data/content.json')
  }

  console.log(`Admin ready: ${email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
