import { pgTable, uuid, text, boolean, timestamp, integer, jsonb, date, index, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role', { enum: ['admin', 'client'] }).notNull().default('client'),
  active: boolean('active').notNull().default(true),
  /** What this member pays per month, in cents. 0 = comped / not billed. */
  monthlyPriceCents: integer('monthly_price_cents').notNull().default(0),
  phone: text('phone'),
  notes: text('notes'),
  /** Member-since date — drives the renewal day shown in HQ. */
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  coachNote: text('coach_note'),
  launchAt: timestamp('launch_at', { withTimezone: true, mode: 'date' }).notNull(),
  timerConfig: jsonb('timer_config').$type<TimerConfig>().notNull().default({}),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const movements = pgTable('movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  groupLabel: text('group_label'),
  seq: integer('seq').notNull().default(0),
  name: text('name').notNull(),
  detail: text('detail'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type', { enum: ['video', 'image'] }),
});

export const completions = pgTable(
  'completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({ uq: uniqueIndex('completions_user_workout_uq').on(t.userId, t.workoutId) })
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    workoutId: uuid('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
    difficulty: text('difficulty', { enum: ['too_easy', 'just_right', 'too_hard'] }).notNull(),
    favoriteMovementId: uuid('favorite_movement_id').references(() => movements.id, { onDelete: 'set null' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ uq: uniqueIndex('reviews_user_workout_uq').on(t.userId, t.workoutId) })
);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  guestName: text('guest_name'),
  guestEmail: text('guest_email'),
  body: text('body').notNull(),
  readAt: timestamp('read_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const referralCodes = pgTable('referral_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand: text('brand').notNull(),
  code: text('code').notNull(),
  url: text('url'),
  blurb: text('blurb'),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per member per America/Chicago day they showed up. This is what
 * STREAKS are built from — showing up counts, and the composite primary key
 * caps it at one credit per calendar day no matter how many times they log in.
 *
 * Deliberately separate from `completions` (finished workouts). Streaks measure
 * the habit; TOTAL WORKOUTS measures the work. Never let one stand in for the other.
 */
export const activeDays = pgTable(
  'active_days',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Chicago calendar day, 'YYYY-MM-DD'. Matches chiDay() exactly. */
    day: date('day', { mode: 'string' }).notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.day] }),
    userDayIdx: index('active_days_user_day_idx').on(t.userId, t.day),
  })
);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  source: text('source'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/**
 * The member's own words about themselves (first-login intake), the note Lyla
 * writes FOR the AI coach, and the waiver consent record.
 *
 * TRUST LEVELS — do not blur these:
 *   users.notes                  → Lyla's private business notes. NEVER sent to the model.
 *   client_profiles.<intake>     → the member's own answers. Sent to the model.
 *   client_profiles.coachContext → Lyla's coaching note. Sent to the model.
 */
export const clientProfiles = pgTable('client_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  age: integer('age'),
  heightIn: integer('height_in'),
  weightLb: integer('weight_lb'),
  experience: text('experience'),
  daysPerWeek: integer('days_per_week'),
  goal: text('goal'),
  injuries: text('injuries'),
  equipment: text('equipment'),
  anythingElse: text('anything_else'),
  coachContext: text('coach_context'),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  agreedAt: timestamp('agreed_at', { withTimezone: true, mode: 'date' }),
  agreedVersion: text('agreed_version'),
  agreedIp: text('agreed_ip'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const workoutsRelations = relations(workouts, ({ many }) => ({
  movements: many(movements),
  completions: many(completions),
  reviews: many(reviews),
}));
export const movementsRelations = relations(movements, ({ one }) => ({
  workout: one(workouts, { fields: [movements.workoutId], references: [workouts.id] }),
}));
export const completionsRelations = relations(completions, ({ one }) => ({
  workout: one(workouts, { fields: [completions.workoutId], references: [workouts.id] }),
  user: one(users, { fields: [completions.userId], references: [users.id] }),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  workout: one(workouts, { fields: [reviews.workoutId], references: [workouts.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  favoriteMovement: one(movements, { fields: [reviews.favoriteMovementId], references: [movements.id] }),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one }) => ({
  user: one(users, { fields: [clientProfiles.userId], references: [users.id] }),
}));

export type TimerConfig = {
  emom?: { rounds: number; interval_sec: number; label?: string };
};
export type Movement = typeof movements.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type User = typeof users.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type ActiveDay = typeof activeDays.$inferSelect;
