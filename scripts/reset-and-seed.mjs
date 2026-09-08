import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

// Get Olivier's user
const users = await sql`SELECT id, email FROM users WHERE email = 'omarschalik@gmail.com'`;
if (!users.length) { console.error("User omarschalik@gmail.com not found"); process.exit(1); }
const OLIVIER_ID = users[0].id;
console.log("Keeping user:", OLIVIER_ID, users[0].email);

// Clear all data (order matters for FK constraints)
await sql`DELETE FROM notes`;
await sql`DELETE FROM tasks`;
await sql`DELETE FROM sections`;
await sql`DELETE FROM project_members`;
await sql`DELETE FROM projects`;
await sql`DELETE FROM users WHERE id != ${OLIVIER_ID}`;
console.log("Database cleared (kept Olivier)");

// Create Ed and Richard
const [ed] = await sql`INSERT INTO users (email, name) VALUES ('ed@bgc.com', 'Ed') RETURNING id`;
const [richard] = await sql`INSERT INTO users (email, name) VALUES ('richard@bgc.com', 'Richard') RETURNING id`;
console.log("Users:", { olivier: OLIVIER_ID, ed: ed.id, richard: richard.id });

// Create project
const [project] = await sql`
  INSERT INTO projects (title, subtitle, owner_id)
  VALUES ('Desk Launch Tracker', 'GPU / Compute Brokerage Desk', ${OLIVIER_ID})
  RETURNING id
`;
const pid = project.id;

// Add members
await sql`
  INSERT INTO project_members (project_id, user_id, email, role, color, joined_at)
  VALUES
    (${pid}, ${OLIVIER_ID}, 'omarschalik@gmail.com', 'owner', '#B4531B', NOW()),
    (${pid}, ${ed.id}, 'ed@bgc.com', 'member', '#16233F', NOW()),
    (${pid}, ${richard.id}, 'richard@bgc.com', 'member', '#1F6F5C', NOW())
`;

// Sections
const sectionNames = [
  "Hiring", "Conferences", "Marketing", "Office space",
  "CRM", "Settlement, ordering, anciliary service", "IT",
];
const sec = {};
for (let i = 0; i < sectionNames.length; i++) {
  const [s] = await sql`INSERT INTO sections (project_id, title, sort_order) VALUES (${pid}, ${sectionNames[i]}, ${i}) RETURNING id`;
  sec[sectionNames[i]] = s.id;
}

async function addTask(section, order, title, status, ownerId, dueDate, phase) {
  const [t] = await sql`
    INSERT INTO tasks (section_id, title, status, owner_id, due_date, phase, sort_order)
    VALUES (${sec[section]}, ${title}, ${status}, ${ownerId}, ${dueDate}, ${phase}, ${order})
    RETURNING id
  `;
  return t.id;
}

async function addNote(taskId, content, authorId, createdAt) {
  await sql`INSERT INTO notes (task_id, content, author_id, created_at) VALUES (${taskId}, ${content}, ${authorId}, ${createdAt})`;
}

// Hiring
const t1 = await addTask("Hiring", 0, "Build a candidate profile per hire: name, role, background, comp ask, and visa status; send to Richard", "done", OLIVIER_ID, "2026-08-31", "Remote week");
const t2 = await addTask("Hiring", 1, "Compile hiring list by roles and calendar", "not_started", OLIVIER_ID, "2026-09-01", "Remote week");
const t3 = await addTask("Hiring", 2, "Request BGC standard employment contract template from Richard / HR", "in_progress", ed.id, null, "Remote week");
await addNote(t3, "Ed to provide one", OLIVIER_ID, "2026-09-02T15:33:00Z");
await addNote(t3, "Candidates could review it before an offer goes out so we can close faster once the offer is there.", null, "2026-08-27T13:55:00Z");

// Conferences
await addTask("Conferences", 0, "List candidate conferences for the year, Flag events with registration deadlines falling before the NYC week", "not_started", OLIVIER_ID, "2026-09-03", "Remote week");
await addTask("Conferences", 1, "Decide in or out per event against desk launch timing", "not_started", richard.id, "2026-09-04", "Remote week");
await addTask("Conferences", 2, "Draft annual conference budget: registration, travel, sponsorship", "not_started", OLIVIER_ID, "2026-09-07", "Remote week");
const t7 = await addTask("Conferences", 3, "Discuss use of the existing conference service vs a BGC-managed process", "not_started", ed.id, null, "NYC week");
await addNote(t7, "Ed could you identify what is available and the kind of timeline they are working with? If they are too slow or complicated , I have a team that does just this", OLIVIER_ID, "2026-08-27T14:03:00Z");

// Marketing
const t8 = await addTask("Marketing", 0, "Scope the website: one-pager vs full site, domain, hosting, content. Check with BGC marketing/web team what they need and how they want to handle that request", "done", ed.id, "2026-09-04", "Remote week");
await addNote(t8, "Ed confirmed we just have to give the content for 1 dummy HTML page that they will style and publish", OLIVIER_ID, "2026-09-02T15:32:00Z");

// Office space
await addTask("Office space", 0, "Confirm whether BGC has Miami space available for the desk or find wework type of space", "not_started", ed.id, "2026-09-03", "Remote week");
const t10 = await addTask("Office space", 1, "Define desk count and move-in timeline", "not_started", OLIVIER_ID, null, "Remote week");
await addNote(t10, "Add desk space to hiring planning", OLIVIER_ID, "2026-08-27T14:06:00Z");

// CRM
const t11 = await addTask("CRM", 0, "Validate whether the desk must use a group-wide CRM", "done", ed.id, null, "NYC week");
await addNote(t11, "No Group CEM, each desk build its own implementation of SFDC.", OLIVIER_ID, "2026-09-02T15:30:00Z");
await addNote(t11, "The core question: group CRM provided, or build one for the desk from scratch.", null, "2026-08-27T13:55:00Z");
const t12 = await addTask("CRM", 1, "If group CRM: scope access and integration for the desk. If no group CRM: decide Meliki vs a new build", "done", OLIVIER_ID, null, "Later");
await addNote(t12, "Probbaly using Meliki for CRM tracking in the first few months and see what are the Group requireemnts if we start to have traction", OLIVIER_ID, "2026-09-02T15:31:00Z");
const t13 = await addTask("CRM", 2, "Confirm the procurement and approval path through BGC for IT products and if they already have prefered tools", "done", ed.id, null, "NYC week");
await addNote(t13, "Ed confirmed that they have SFDC licenses", OLIVIER_ID, "2026-09-02T15:31:00Z");

// Settlement
await addTask("Settlement, ordering, anciliary service", 0, "Prepare the questions list ahead of the NYC meetings", "not_started", OLIVIER_ID, "2026-09-16", "Remote week");
await addTask("Settlement, ordering, anciliary service", 1, "Identify the contacts to meet in NYC and line up meetings", "not_started", richard.id, null, "Remote week");

// IT
const t16 = await addTask("IT", 0, "Scope porting the current Meliki implementation into the BGC environment", "done", OLIVIER_ID, null, "NYC week");
await addNote(t16, "HTML sent to Ed", OLIVIER_ID, "2026-09-02T15:29:00Z");
await addNote(t16, "Infra, hosting, data migration, access and security requirements.", null, "2026-08-27T13:55:00Z");
await addTask("IT", 1, "Confirm IT onboarding: hardware, network access, credentials, security review", "not_started", ed.id, null, "Remote week");

console.log("Done! 17 tasks seeded across 7 sections.");
