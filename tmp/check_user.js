const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({where:{email:'renatadouglas739@gmail.com'}}).then(u => { 
  console.log('Password:', u.password); 
  console.log('Length:', u.password.length); 
  prisma.$disconnect(); 
});
