import 'dotenv/config';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const adapter = new PrismaMssql(sqlConfig);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  console.log('Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@home.local' },
    update: {},
    create: {
      email: 'admin@home.local',
      name: 'Admin',
      passwordHash: await bcrypt.hash('ChangeMe123!', 12),
      role: 'ADMIN',
      avatarColor: '#F97316',
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create default event categories
  console.log('Creating default event categories...');
  const categories = [
    { name: 'Family', color: '#F97316', icon: 'home' },      // Orange (Cemdash primary)
    { name: 'Work', color: '#3B82F6', icon: 'briefcase' },   // Blue
    { name: 'Medical', color: '#EF4444', icon: 'heart' },    // Red
    { name: 'Social', color: '#8B5CF6', icon: 'users' },     // Purple
    { name: 'Finance', color: '#10B981', icon: 'dollar-sign' }, // Green
    { name: 'Other', color: '#6B7280', icon: 'calendar' },   // Gray
  ];

  for (const category of categories) {
    await prisma.eventCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`✅ Category created: ${category.name}`);
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
