import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  credibilityScore: integer("credibility_score").notNull().default(7), // Scale of 1-10
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenanceIssues = pgTable("maintenance_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "plumbing", "electrical", "civil", etc.
  severity: text("severity").notNull(), // "critical", "high", "medium", "low"
  status: text("status").notNull().default("open"), // "open", "assigned", "in_progress", "resolved"
  progress: integer("progress").notNull().default(0), // 0-100
  location: text("location"),
  imageUrls: jsonb("image_urls").$type<string[]>().default(sql`'[]'::jsonb`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  assignedTechnicianId: varchar("assigned_technician_id").references(() => technicians.id),
  aiAnalysis: jsonb("ai_analysis").$type<{
    domain: string;
    category: string;
    urgency: string;
    priority: string;
    severity: string;
    confidence: number;
    reasoning: string;
    estimatedCost: string;
    timeToResolve: string;
    riskLevel: string;
  }>(),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const technicians = pgTable("technicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(), // "plumbing", "electrical", "general", etc.
  status: text("status").notNull().default("available"), // "available", "busy", "offline"
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  issueId: varchar("issue_id").notNull().references(() => maintenanceIssues.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const upvotes = pgTable("upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull().references(() => maintenanceIssues.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceIssueSchema = createInsertSchema(maintenanceIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  progress: true,
  upvotes: true,
  status: true,
}).extend({
  aiAnalysis: z.object({
    domain: z.string(),
    category: z.string(),
    urgency: z.string(),
    priority: z.string(),
    severity: z.string(),
    confidence: z.number(),
    reasoning: z.string(),
    estimatedCost: z.string(),
    timeToResolve: z.string(),
    riskLevel: z.string(),
  }).optional(),
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MaintenanceIssue = typeof maintenanceIssues.$inferSelect;
export type InsertMaintenanceIssue = z.infer<typeof insertMaintenanceIssueSchema>;

export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Upvote = typeof upvotes.$inferSelect;
