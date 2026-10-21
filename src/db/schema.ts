import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "MASTER",
  "COLABORADOR",
  "EXPOSITOR",
  "AVALIADOR",
  "VISITANTE",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "EXPOSITOR",
  "AVALIADOR",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  tempPasswordHint: varchar("temp_password_hint", { length: 100 }),
  isAccredited: boolean("is_accredited").default(false).notNull(),
  accreditationUnlocked: boolean("accreditation_unlocked").default(false).notNull(),
  savedSignatureData: text("saved_signature_data"),
  accreditationSignature: text("accreditation_signature"),
  accreditedAt: timestamp("accredited_at"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  visitorShortCode: varchar("visitor_short_code", { length: 20 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  sigaaCode: varchar("sigaa_code", { length: 60 }).notNull().unique(),
  shortCode: varchar("short_code", { length: 10 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  standLocation: varchar("stand_location", { length: 120 }).notNull(),
  shift: varchar("shift", { length: 40 }).notNull(),
  bio: text("bio").notNull(),
  logoUrl: text("logo_url"),
  stampImageUrl: text("stamp_image_url"),
  isAccredited: boolean("is_accredited").default(false).notNull(),
  accreditationUnlocked: boolean("accreditation_unlocked").default(false).notNull(),
  accreditationSignature: text("accreditation_signature"),
  accreditedByUserId: uuid("accredited_by_user_id"),
  accreditedAt: timestamp("accredited_at"),
  activeStampToken: varchar("active_stamp_token", { length: 20 }),
  stampTokenExpiresAt: timestamp("stamp_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
  color: varchar("color", { length: 30 }).notNull(),
});

export const projectTags = pgTable(
  "project_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("project_tag_unique").on(table.projectId, table.tagId)]
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memberRole: memberRoleEnum("member_role").notNull(),
  },
  (table) => [
    uniqueIndex("project_member_unique").on(
      table.projectId,
      table.userId,
      table.memberRole
    ),
  ]
);

export const visitorInterests = pgTable(
  "visitor_interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("visitor_tag_unique").on(table.visitorId, table.tagId)]
);

export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    evaluatorId: uuid("evaluator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scoreLogbook: integer("score_logbook").notNull(), // 0 a 5
    scoreRelevance: integer("score_relevance").notNull(), // 0 a 5
    scoreMethodology: integer("score_methodology").notNull(), // 0 a 5
    scorePresentation: integer("score_presentation").notNull(), // 0 a 5
    scoreStand: integer("score_stand").notNull(), // 0 a 5
    totalScore: numeric("total_score", { precision: 5, scale: 2 }).notNull(),
    feedbackNotes: text("feedback_notes"),
    signatureData: text("signature_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("evaluation_project_evaluator_unique").on(
      table.projectId,
      table.evaluatorId
    ),
  ]
);

export const passportStamps = pgTable(
  "passport_stamps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    isSpent: boolean("is_spent").default(false).notNull(),
    redemptionId: uuid("redemption_id"),
    likedProject: boolean("liked_project").default(false).notNull(),
    collectedAt: timestamp("collected_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("passport_visitor_project_unique").on(
      table.visitorId,
      table.projectId
    ),
  ]
);

export const rewards = pgTable("rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: varchar("description", { length: 300 }).notNull(),
  iconName: varchar("icon_name", { length: 50 }).notNull(),
  stampCost: integer("stamp_cost").notNull(),
  stockQuantity: integer("stock_quantity").notNull(),
});

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitorId: uuid("visitor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardId: uuid("reward_id")
    .notNull()
    .references(() => rewards.id, { onDelete: "cascade" }),
  collaboratorId: uuid("collaborator_id")
    .notNull()
    .references(() => users.id),
  stampsDebited: integer("stamps_debited").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

export const scheduleItems = pgTable("schedule_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  dayLabel: varchar("day_label", { length: 80 }).notNull(),
  timeRange: varchar("time_range", { length: 60 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  location: varchar("location", { length: 150 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
});

export type UserRole = "MASTER" | "COLABORADOR" | "EXPOSITOR" | "AVALIADOR" | "VISITANTE";
export type MemberRole = "EXPOSITOR" | "AVALIADOR";
