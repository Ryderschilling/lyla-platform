/**
 * Changes the admin's email and/or password on the live db.
 *
 *   npm run db:set-admin -- --email='lyla@example.com' --password='her-password'
 *   npm run db:set-admin -- --password='new-one-only'
 *   npm run db:set-admin -- --email='x@y.com' --name='Lyla Schilling'
 *
 * SINGLE-QUOTE the password. Passwords with ! or $ get mangled by the shell
 * otherwise (bash expands `!` from history), and you'd silently set a password
 * you can't type again.
 *
 * Why a script and not a hardcoded seed value: real credentials must never land
 * in a git-tracked file. `seed.ts` only ever writes a throwaway placeholder;
 * this is how the real login gets set, and it never touches disk.
 *
 * Note: existing session cookies stay valid for their full 30 days, and the JWT
 * carries a snapshot of the old email. Log out and back in after running this.
 */
import './env';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing — put it in .env.local');
const sql = neon(url);

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
};

const email = flag('email')?.trim().toLowerCase();
const password = flag('password');
const name = flag('name')?.trim();

function usage(msg: string): never {
  console.error(`\n${msg}\n`);
  console.error("  npm run db:set-admin -- --email='new@email.com' --password='new-password'");
  console.error('  (single-quote the password so the shell leaves ! and $ alone)\n');
  process.exit(1);
}

async function main() {
  if (!email && !password && !name) usage('Nothing to change.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) usage(`"${email}" doesn't look like an email.`);
  if (password !== undefined && password.length < 8) usage('Password needs at least 8 characters.');

  const admins = await sql`select id, email, full_name from users where role = 'admin'`;
  if (!admins.length) usage('No admin account found. Run npm run db:seed first.');
  if (admins.length > 1) usage(`Found ${admins.length} admin accounts — resolve that by hand before using this.`);
  const admin = admins[0];

  // an email collision would break login for both accounts
  if (email && email !== String(admin.email).toLowerCase()) {
    const taken = await sql`select id from users where lower(email) = ${email} and id <> ${admin.id}`;
    if (taken.length) usage(`${email} is already used by another account.`);
  }

  const nextEmail = email ?? admin.email;
  const nextName = name ?? admin.full_name;
  const nextHash = password !== undefined ? bcrypt.hashSync(password, 10) : null;

  if (nextHash) {
    await sql`update users set email = ${nextEmail}, full_name = ${nextName}, password_hash = ${nextHash} where id = ${admin.id}`;
  } else {
    await sql`update users set email = ${nextEmail}, full_name = ${nextName} where id = ${admin.id}`;
  }

  console.log(`\nadmin updated: ${admin.email} -> ${nextEmail}`);
  console.log(`  name      ${nextName}`);
  console.log(`  password  ${nextHash ? 'changed' : 'unchanged'}`);
  console.log('\nLog out and back in — your current cookie still carries the old email.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
