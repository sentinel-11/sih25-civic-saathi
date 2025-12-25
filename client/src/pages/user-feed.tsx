import { useQuery } from "@tanstack/react-query";
import { FeedPost } from "@/components/feed/feed-post";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceIssue, User } from "@shared/schema";

interface UserFeedPageProps {
  onOpenMap?: () => void;
  onOpenReport?: () => void;
}

export default function UserFeedPage({ onOpenMap, onOpenReport }: UserFeedPageProps) {
  const { data: issues, isLoading } = useQuery<
    (MaintenanceIssue & { reporter: User })[]
  >({
    queryKey: ["/api/issues"],
  });

  if (isLoading) {
    return (
      <div className="h-screen snap-y snap-mandatory overflow-y-scroll">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-screen snap-start flex items-center justify-center p-4">
            <Skeleton className="h-full w-full max-w-md rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] snap-y snap-mandatory overflow-y-scroll">
      {/* Feed Posts - Each takes full screen */}
      {issues?.map((issue) => (
        <div key={issue.id} className="h-full snap-start flex items-center justify-center">
          <div className="w-full h-full max-w-md">
            <FeedPost issue={issue} isMobile />
          </div>
        </div>
      ))}

      {/* Empty State */}
      {!issues?.length && (
        <div className="h-full snap-start flex items-center justify-center p-4">
          <div className="text-center bg-white rounded-xl border border-gray-200 p-12 w-full max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No Issues Yet
            </h3>
            <p className="text-gray-600">
              No maintenance issues have been reported yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
