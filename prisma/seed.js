/**
 * One-time setup script: creates (or updates) the two accounts for this app.
 * Run with: npm run setup-users
 *
 * Prompts for a display name and a PIN for each person, hashes the PIN with
 * bcrypt, and upserts the user into the database. Safe to re-run later to
 * change a PIN.
 */
const readline = require("readline");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function validatePin(pin) {
  return /^[0-9]{4,8}$/.test(pin);
}

async function promptForPerson(rl, label) {
  let name = "";
  while (!name) {
    name = (await ask(rl, `${label} display name (e.g. "Caleb"): `)).trim();
  }

  let pin = "";
  while (!validatePin(pin)) {
    pin = (await ask(rl, `${label} PIN (4-8 digits) for ${name}: `)).trim();
    if (!validatePin(pin)) {
      console.log("  PIN must be 4-8 digits, numbers only. Try again.");
    }
  }

  return { name, pin };
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("Setting up the two accounts for this app.\n");

  const person1 = await promptForPerson(rl, "Person 1");
  const person2 = await promptForPerson(rl, "Person 2");

  rl.close();

  for (const person of [person1, person2]) {
    const pinHash = await bcrypt.hash(person.pin, 10);
    await prisma.user.upsert({
      where: { name: person.name },
      update: { pinHash },
      create: { name: person.name, pinHash },
    });
    console.log(`Saved account for ${person.name}.`);
  }

  console.log("\nDone. You can now log in at /login with either name and PIN.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
