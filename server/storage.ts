import {
  type User,
  type InsertUser,
  type MaintenanceIssue,
  type InsertMaintenanceIssue,
  type Technician,
  type InsertTechnician,
  type Comment,
  type InsertComment,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Maintenance Issues
  getAllIssues(): Promise<(MaintenanceIssue & { reporter: User })[]>;
  getIssue(id: string): Promise<MaintenanceIssue | undefined>;
  createIssue(issue: InsertMaintenanceIssue): Promise<MaintenanceIssue>;
  updateIssue(
    id: string,
    updates: Partial<MaintenanceIssue>
  ): Promise<MaintenanceIssue | undefined>;
  deleteIssue(id: string): Promise<boolean>;

  // Technicians
  getAllTechnicians(): Promise<Technician[]>;
  getTechnician(id: string): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(
    id: string,
    updates: Partial<Technician>
  ): Promise<Technician | undefined>;

  // Comments
  getCommentsByIssueId(issueId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Upvotes
  toggleUpvote(
    issueId: string,
    userId: string
  ): Promise<{ upvoted: boolean; newCount: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private issues: Map<string, MaintenanceIssue> = new Map();
  private technicians: Map<string, Technician> = new Map();
  private comments: Map<string, Comment> = new Map();
  private upvotes: Map<string, Set<string>> = new Map(); // issueId -> Set of userIds

  constructor() {
    this.seedData();
  }

  // Method to reset data to original sample posts only
  resetToOriginalSampleData() {
    // Clear all current data
    this.issues.clear();
    this.users.clear();
    this.technicians.clear();
    this.comments.clear();
    this.upvotes.clear();

    // Regenerate original sample data
    this.seedData();
  }

  private seedData() {
    // Create demo users
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@maintain.ai",
      role: "admin",
      credibilityScore: 9,
      firebaseUid: "admin-firebase-uid",
      createdAt: new Date(),
    };

    const regularUser: User = {
      id: randomUUID(),
      username: "user",
      email: "user@maintain.ai",
      role: "user",
      credibilityScore: 7,
      firebaseUid: "user-firebase-uid",
      createdAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(regularUser.id, regularUser);

    // Create demo technicians
    const technicians: Technician[] = [
      {
        id: randomUUID(),
        name: "John Smith",
        specialty: "Plumbing",
        status: "available",
        phone: "+1-555-0101",
        email: "john@maintain.ai",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Lisa Garcia",
        specialty: "Electrical",
        status: "busy",
        phone: "+1-555-0102",
        email: "lisa@maintain.ai",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Tom Wilson",
        specialty: "General",
        status: "available",
        phone: "+1-555-0103",
        email: "tom@maintain.ai",
        createdAt: new Date(),
      },
    ];

    technicians.forEach((tech) => this.technicians.set(tech.id, tech));

    // Create demo issues
    const demoIssues: MaintenanceIssue[] = [
      {
        id: randomUUID(),
        title: "Water leak in Building A hallway",
        description:
          "Major water leak in the hallway near Room 315. Water is spreading rapidly and affecting multiple units. Urgent attention needed!",
        category: "plumbing",
        severity: "high",
        status: "in_progress",
        progress: 75,
        location: "Building A, Floor 3",
        imageUrls: ["/sample-images/Water-leaking-into-hallway.jpg"],
        reporterId: regularUser.id,
        assignedTechnicianId: technicians[0].id,
        aiAnalysis: {
          category: "Plumbing Emergency",
          severity: "High",
          reasoning:
            "Water damage can spread quickly and cause structural damage. Immediate response required to prevent further property damage and potential safety hazards.",
        },
        upvotes: 24,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Flickering lights in library",
        description:
          "Flickering lights in the main reading area. Affecting multiple study areas and causing distraction for students.",
        category: "electrical",
        severity: "medium",
        status: "assigned",
        progress: 30,
        location: "Library Building",
        imageUrls: ["/sample-images/flickering-light-bulb.jpg"],
        reporterId: adminUser.id,
        assignedTechnicianId: technicians[1].id,
        aiAnalysis: {
          category: "Electrical Maintenance",
          severity: "Medium",
          reasoning:
            "Electrical issues affecting productivity but not immediately dangerous. Should be scheduled within 24 hours to prevent potential disruption to daily operations.",
        },
        upvotes: 12,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Paint peeling in cafeteria",
        description:
          "Paint peeling on the wall near the entrance. Not urgent but affects the appearance of the space.",
        category: "cosmetic",
        severity: "low",
        status: "open",
        progress: 10,
        location: "Cafeteria",
        imageUrls: ["/sample-images/paint-peeling-on-wall.jpg"],
        reporterId: regularUser.id,
        assignedTechnicianId: null,
        aiAnalysis: {
          category: "Cosmetic/Paint",
          severity: "Low",
          reasoning:
            "Cosmetic issue that can be scheduled for routine maintenance within 2 weeks. Affects appearance but poses no immediate safety concerns.",
        },
        upvotes: 6,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(),
      },
    ];

    demoIssues.forEach((issue) => this.issues.set(issue.id, issue));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      credibilityScore: insertUser.credibilityScore || 7,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Issue methods
  async getAllIssues(): Promise<(MaintenanceIssue & { reporter: User })[]> {
    const issues = Array.from(this.issues.values());
    const issuesWithReporter = await Promise.all(
      issues.map(async (issue) => {
        const reporter = await this.getUser(issue.reporterId);
        if (!reporter) {
          // Create a placeholder user for missing reporters
          return {
            ...issue,
            reporter: {
              id: issue.reporterId,
              username: "Unknown User",
              email: "unknown@maintain.ai",
              role: "user" as const,
              credibilityScore: 0,
              firebaseUid: "unknown",
              createdAt: new Date(),
            },
          };
        }
        return {
          ...issue,
          reporter,
        };
      })
    );
    return issuesWithReporter.sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getIssue(id: string): Promise<MaintenanceIssue | undefined> {
    return this.issues.get(id);
  }

  async createIssue(
    insertIssue: InsertMaintenanceIssue
  ): Promise<MaintenanceIssue> {
    const id = randomUUID();
    const issue: MaintenanceIssue = {
      ...insertIssue,
      id,
      status: "open",
      progress: 0,
      upvotes: 0,
      location: insertIssue.location || null,
      imageUrls: insertIssue.imageUrls || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.issues.set(id, issue);
    return issue;
  }

  async updateIssue(
    id: string,
    updates: Partial<MaintenanceIssue>
  ): Promise<MaintenanceIssue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;

    const updatedIssue = {
      ...issue,
      ...updates,
      updatedAt: new Date(),
    };
    this.issues.set(id, updatedIssue);
    return updatedIssue;
  }

  async deleteIssue(id: string): Promise<boolean> {
    return this.issues.delete(id);
  }

  async getUserIssues(
    userId: string
  ): Promise<(MaintenanceIssue & { reporter: User })[]> {
    const issues = Array.from(this.issues.values()).filter(
      (issue) => issue.reporterId === userId
    );
    return issues
      .map((issue) => ({
        ...issue,
        reporter: this.users.get(issue.reporterId)!,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
  }

  // Technician methods
  async getAllTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values());
  }

  async getTechnician(id: string): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async createTechnician(
    insertTechnician: InsertTechnician
  ): Promise<Technician> {
    const id = randomUUID();
    const technician: Technician = {
      ...insertTechnician,
      id,
      status: insertTechnician.status || "available",
      email: insertTechnician.email || null,
      phone: insertTechnician.phone || null,
      createdAt: new Date(),
    };
    this.technicians.set(id, technician);
    return technician;
  }

  async updateTechnician(
    id: string,
    updates: Partial<Technician>
  ): Promise<Technician | undefined> {
    const technician = this.technicians.get(id);
    if (!technician) return undefined;

    const updatedTechnician = { ...technician, ...updates };
    this.technicians.set(id, updatedTechnician);
    return updatedTechnician;
  }

  // Comment methods
  async getCommentsByIssueId(issueId: string): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.issueId === issueId
    );
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  // Upvote methods
  async toggleUpvote(
    issueId: string,
    userId: string
  ): Promise<{ upvoted: boolean; newCount: number }> {
    if (!this.upvotes.has(issueId)) {
      this.upvotes.set(issueId, new Set());
    }

    const userUpvotes = this.upvotes.get(issueId)!;
    const wasUpvoted = userUpvotes.has(userId);

    if (wasUpvoted) {
      userUpvotes.delete(userId);
    } else {
      userUpvotes.add(userId);
    }

    const issue = this.issues.get(issueId);
    if (issue) {
      issue.upvotes = userUpvotes.size;
      this.issues.set(issueId, issue);
    }

    return {
      upvoted: !wasUpvoted,
      newCount: userUpvotes.size,
    };
  }
}

export const storage = new MemStorage();
