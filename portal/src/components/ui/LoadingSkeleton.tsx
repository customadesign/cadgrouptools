'use client';

import { Skeleton, Card } from 'antd';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'detail';
  count?: number;
}

export default function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <Skeleton active title paragraph={{ rows: 4 }} />
        </Card>
        <Card className="animate-pulse">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  return <Skeleton active />;
}

