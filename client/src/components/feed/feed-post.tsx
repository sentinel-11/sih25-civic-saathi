import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MaintenanceIssue, User } from "@shared/schema";
import {
  ArrowUp,
  MessageCircle,
  Share,
  MoreHorizontal,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface FeedPostProps {
  issue: MaintenanceIssue & { reporter: User };
  isMobile?: boolean;
}

export function FeedPost({ issue, isMobile = false }: FeedPostProps) {
  const [isUpvoted, setIsUpvoted] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/issues/${issue.id}/upvote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setIsUpvoted(!isUpvoted);
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white";
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case "immediate":
        return "bg-red-600 text-white";
      case "urgent":
        return "bg-orange-100 text-orange-800";
      case "standard":
        return "bg-blue-100 text-blue-800";
      case "routine":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`bg-white ${isMobile ? 'h-full flex flex-col' : 'rounded-xl border border-gray-200 shadow-sm hover:shadow-md'} transition-all duration-300 overflow-hidden`}>
      {/* Post Header */}
      <div className={`${isMobile ? 'p-4' : 'p-6'} pb-3 flex-shrink-0`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}>
              <UserIcon className="text-white" size={isMobile ? 18 : 20} />
            </div>
            <div className="flex-1 min-w-0">
              {/* User and Rating - First Line */}
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>
                  {issue.reporter?.username || 'user'}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium text-xs px-2 py-0.5"
                >
                  ⭐ {issue.reporter?.credibilityScore || 0}
                </Badge>
                <Badge
                  className={`${getSeverityColor(issue.severity)} font-medium text-xs px-2 py-0.5`}
                >
                  {issue.severity.toUpperCase()}
                </Badge>
              </div>
              
              {/* Location and Time - Second Line */}
              <div className="flex items-center gap-3 text-xs">
                {issue.location && (
                  <div className="flex items-center gap-1 text-blue-700">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">{issue.location}</span>
                  </div>
                )}
                <span className="text-gray-600">
                  {formatDistanceToNow(new Date(issue.createdAt!), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <MoreHorizontal className="text-gray-400" size={16} />
          </Button>
        </div>
      </div>

      {/* Post Content - Scrollable area */}
      <div className={`${isMobile ? 'px-4 pb-2 flex-1 overflow-y-auto' : 'px-6 pb-4'}`}>
        
        {/* Caption/Description - User's text */}
        <p className={`text-gray-900 ${isMobile ? 'text-sm' : 'text-base'} leading-relaxed mb-3 font-normal`}>
          {issue.description}
        </p>

        {/* Post Images */}
        {issue.imageUrls && issue.imageUrls.length > 0 && (
          <div className={`mb-3 ${isMobile ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'}`}>
            {issue.imageUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Issue image ${idx + 1}`}
                className={`w-full ${isMobile ? 'h-48 rounded-lg' : 'h-48 rounded-lg'} object-cover`}
              />
            ))}
          </div>
        )}

        {/* AI Analysis Section */}
        {issue.aiAnalysis && (
          <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3 mb-3 space-y-2' : 'p-4 mb-4 space-y-3'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="text-gray-600" size={isMobile ? 14 : 16} />
                <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>AI Analysis</span>
              </div>
            </div>

            {/* Domain and Severity Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {issue.aiAnalysis.domain && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-medium">
                  {issue.aiAnalysis.domain}
                </Badge>
              )}
              {issue.aiAnalysis.category && (
                <Badge variant="outline" className="text-xs border-gray-300">
                  {issue.aiAnalysis.category}
                </Badge>
              )}
              {issue.aiAnalysis.severity && (
                <Badge className={`${getSeverityColor(issue.aiAnalysis.severity)} text-xs font-medium`}>
                  {issue.aiAnalysis.severity}
                </Badge>
              )}
              {issue.aiAnalysis.urgency && (
                <Badge className={`${getUrgencyColor(issue.aiAnalysis.urgency)} text-xs`}>
                  {issue.aiAnalysis.urgency}
                </Badge>
              )}
              {issue.aiAnalysis.confidence && (
                <Badge variant="outline" className="text-xs border-gray-300">
                  {Math.round(issue.aiAnalysis.confidence * 100)}% confidence
                </Badge>
              )}
            </div>
            {/* Cost and Time Estimates */}
            {(issue.aiAnalysis.estimatedCost || issue.aiAnalysis.timeToResolve) && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-700 mb-2">
                {issue.aiAnalysis.estimatedCost && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">💰</span>
                    <span>{issue.aiAnalysis.estimatedCost}</span>
                  </div>
                )}
                {issue.aiAnalysis.timeToResolve && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">⏱️</span>
                    <span>{issue.aiAnalysis.timeToResolve}</span>
                  </div>
                )}
              </div>
            )}

            {/* AI Reasoning */}
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 leading-relaxed`}>
              {issue.aiAnalysis.reasoning}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
          <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
            <span>Progress</span>
            <span className="font-medium">{issue.progress}%</span>
          </div>
          <div className={`bg-gray-200 rounded-full ${isMobile ? 'h-2' : 'h-3'} overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-gray-700 to-gray-800 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${issue.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {issue.status === "resolved"
              ? "✅ Resolved"
              : issue.status === "in_progress"
                ? "🔧 In Progress"
                : issue.status === "assigned"
                  ? "👤 Assigned"
                  : "📝 Reported"}
          </p>
        </div>
      </div>

      {/* Post Actions */}
      <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'} border-t border-gray-100 pt-3 flex-shrink-0`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => upvoteMutation.mutate()}
              disabled={upvoteMutation.isPending}
              className={`flex items-center space-x-1 transition-all duration-200 ${
                isUpvoted
                  ? "text-red-500 bg-red-50"
                  : "text-gray-500 hover:text-red-500 hover:bg-red-50"
              } ${isMobile ? 'px-2 py-1.5' : 'px-4 py-2'} rounded-lg`}
            >
              <ArrowUp size={isMobile ? 16 : 18} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                {issue.upvotes + (isUpvoted ? 1 : 0)}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all ${isMobile ? 'px-2 py-1.5' : 'px-4 py-2'} rounded-lg`}
            >
              <MessageCircle size={isMobile ? 16 : 18} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>8</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 text-gray-500 hover:text-green-500 hover:bg-green-50 transition-all ${isMobile ? 'px-2 py-1.5' : 'px-4 py-2'} rounded-lg`}
            >
              <Share size={isMobile ? 16 : 18} />
            </Button>
          </div>

          <Badge
            className={`${getStatusColor(issue.status)} ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'} font-medium`}
          >
            {issue.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  );
}
