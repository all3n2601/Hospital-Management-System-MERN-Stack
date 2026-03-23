interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
}

export function LoadingSkeleton({ rows = 5, cols = 4 }: LoadingSkeletonProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-3 bg-muted/50 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-muted animate-pulse rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-3 border-b last:border-0">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-4 bg-muted animate-pulse rounded flex-1"
              style={{ animationDelay: `${(rowIdx * cols + colIdx) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
