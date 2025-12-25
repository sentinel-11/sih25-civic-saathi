import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMaintenanceIssueSchema, insertUserSchema } from "@shared/schema";
import { analyzeMaintenanceIssue } from "./services/gemini";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/firebase/:uid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Issues routes
  app.get("/api/issues", async (req, res) => {
    try {
      const issues = await storage.getAllIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's issues
  app.get("/api/issues/my", async (req, res) => {
    try {
      // In a real app, get user ID from authenticated session
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const issues = await storage.getUserIssues(userId);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/issues", async (req, res) => {
    try {
      console.log("Received issue data:", JSON.stringify(req.body, null, 2));
      const issueData = insertMaintenanceIssueSchema.parse(req.body);
      const issue = await storage.createIssue(issueData);
      res.status(201).json(issue);
    } catch (error) {
      console.error("Issue creation error:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid issue data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/issues/:id", async (req, res) => {
    try {
      const updates = req.body;
      const issue = await storage.updateIssue(req.params.id, updates);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/issues/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteIssue(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/issues/:id/upvote", async (req, res) => {
    try {
      // TODO: Get userId from authentication
      const userId = "demo-user-id"; // Placeholder
      const result = await storage.toggleUpvote(req.params.id, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset data to original sample posts
  app.post("/api/reset-data", async (req, res) => {
    try {
      (storage as any).resetToOriginalSampleData();
      res.json({ message: "Data reset to original sample posts successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Technicians routes
  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await storage.getAllTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/technicians/:id", async (req, res) => {
    try {
      const technician = await storage.getTechnician(req.params.id);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      res.json(technician);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Analysis route
  app.post("/api/analyze-issue", async (req, res) => {
    try {
      const { description, imageBase64 } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const analysis = await analyzeMaintenanceIssue(description, imageBase64);
      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Comments routes
  app.get("/api/issues/:issueId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByIssueId(req.params.issueId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/issues/:issueId/comments", async (req, res) => {
    try {
      const { content, userId } = req.body;
      const comment = await storage.createComment({
        content,
        issueId: req.params.issueId,
        userId,
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
