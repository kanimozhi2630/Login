import prisma from './src/config/database.js'
import { hashPassword } from './src/utils/passwordHasher.js'

async function createTestUser() {
  try {
    const email = 'test@example.com'
    const name = 'Test User'
    const password = 'Test123!@#'
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.log('Test user already exists:', email)
      return
    }
    
    const passwordHash = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: true
      }
    })
    
    console.log('Test user created successfully:')
    console.log(`- Email: ${email}`)
    console.log(`- Password: ${password}`)
    console.log(`- Verified: ${user.emailVerified}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
