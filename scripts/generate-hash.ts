import bcrypt from 'bcryptjs';

async function main() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);

  console.log('\n🔐 Password Hash Generated:');
  console.log('-----------------------------------');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('-----------------------------------');
  console.log('\nCopy this hash and paste it into Prisma Studio for the hashedPassword field');
}

main();
