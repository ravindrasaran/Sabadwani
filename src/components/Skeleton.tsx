import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div 
      className={`animate-pulse bg-ink/10 rounded-xl ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }}
    />
  );
};

export const ShabadSkeleton = () => (
  <div className="flex items-center gap-4 p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 shadow-sm animate-pulse">
    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
    <Skeleton className="h-5 rounded w-3/4" />
  </div>
);

export const PostSkeleton = () => (
  <div className="bg-white/60 rounded-2xl p-6 shadow-sm border border-ink/5 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 rounded w-1/3 mb-2" />
        <Skeleton className="h-3 rounded w-1/4" />
      </div>
    </div>
    <Skeleton className="h-6 rounded w-3/4 mb-4" />
    <Skeleton className="h-4 rounded w-full mb-2" />
    <Skeleton className="h-4 rounded w-5/6" />
  </div>
);

export const BannerSkeleton = () => (
  <div className="mx-4 my-1.5 h-[110px] bg-white/60 rounded-[2rem] border border-ink/5 shadow-sm animate-pulse p-4 flex flex-col justify-center">
    <Skeleton className="h-3 w-24 mb-3" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-3 w-1/4 self-end" />
  </div>
);

export const CategorySkeleton = () => (
  <div className="aspect-square bg-white/60 rounded-2xl border border-ink/5 shadow-sm animate-pulse flex flex-col items-center justify-center p-2">
    <Skeleton className="w-8 h-8 rounded-xl mb-2" />
    <Skeleton className="h-3 w-12 mb-1" />
    <Skeleton className="h-3 w-16" />
  </div>
);

export const MelaSkeleton = () => (
  <div className="bg-white/60 p-5 rounded-3xl shadow-sm border border-ink/5 animate-pulse mb-4">
    <div className="flex justify-between items-start mb-3">
      <Skeleton className="h-6 w-1/2 rounded-lg" />
      <Skeleton className="h-4 w-20 rounded-full" />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="w-4 h-4 rounded-full" />
      <Skeleton className="h-4 w-1/3 rounded" />
    </div>
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="w-4 h-4 rounded-full" />
      <Skeleton className="h-4 w-1/4 rounded" />
    </div>
    <Skeleton className="h-20 w-full rounded-xl" />
  </div>
);

export default Skeleton;
