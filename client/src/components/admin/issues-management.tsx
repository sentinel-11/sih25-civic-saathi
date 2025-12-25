import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MaintenanceIssue, User } from "@shared/schema";
import { Edit, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IssuesManagementProps {
  issues: (MaintenanceIssue & { reporter: User })[];
}

export function IssuesManagement({ issues }: IssuesManagementProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredIssues = issues.filter((issue) => {
    if (filter === "all") return true;
    return issue.severity === filter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="lg:col-span-2 admin-card hover-glow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Recent Issues</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="text-sm"
            >
              All
            </Button>
            <Button
              variant={filter === "high" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFilter("high")}
              className="text-sm"
            >
              High
            </Button>
            <Button
              variant={filter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("medium")}
              className="text-sm bg-yellow-500 hover:bg-yellow-600"
            >
              Medium
            </Button>
            <Button
              variant={filter === "low" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("low")}
              className="text-sm bg-green-500 hover:bg-green-600"
            >
              Low
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-6 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      #{issue.id.slice(-6)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(issue.createdAt!), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <h3 className="font-medium text-gray-900 mb-1 break-words">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                    <span>
                      Reporter: {issue.reporter?.username || "Unknown Reporter"}
                    </span>
                    <span>Category: {issue.category}</span>
                    {issue.location && <span>Location: {issue.location}</span>}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-admin-mid transition-colors duration-200 hover-lift"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200 hover-lift"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 hover-lift"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4">
                <Progress value={issue.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
