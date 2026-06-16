import bcrypt from 'bcryptjs';
import 'dotenv/config';

const password = process.argv[2] ?? 'Admin@1234';
const hash = await bcrypt.hash(password, 10);
console.log('\nPassword:', password);
console.log('Hash bcrypt:\n', hash, '\n');
