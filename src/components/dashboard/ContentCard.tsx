'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export interface ContentCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** Modern card with glassmorphism and gradient accents */
export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  children,
  actions,
  className = '',
  noPadding = false,
}) => (
  <Card className={`group relative overflow-hidden border-border/70 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md ${className}`}>
    {/* Decorative gradient accent */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    
    <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-primary/10 bg-gradient-to-br from-primary/[0.04] to-accent/[0.02] py-4 relative">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 h-12 w-12 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="min-w-0 relative z-10">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          {title}
          {/* Animated pulse indicator */}
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
        </CardTitle>
        {description && (
          <CardDescription className="mt-0.5 text-sm">{description}</CardDescription>
        )}
      </div>
      {actions && <div className="shrink-0 relative z-10">{actions}</div>}
    </CardHeader>
    <CardContent className={noPadding ? 'p-0' : 'pt-4'}>{children}</CardContent>
  </Card>
);
