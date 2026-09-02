'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { FileCode2 } from 'lucide-react';

interface CodeSnippetProps {
  filename: string;
  language: string;
  comment: string;
  children: React.ReactNode;
  index?: number;
  className?: string;
}

/**
 * Light-theme code card. Editor chrome has 3 dots in yellow/orange/pink
 * (not the macOS red/yellow/green). A colored gradient strip on top
 * accents the card. One-line "what's impressive" caption underneath.
 */
export function CodeSnippet({
  filename,
  language,
  comment,
  children,
  index = 0,
  className,
}: CodeSnippetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className={cn(
        'ryda-glass-elevated rounded-xl overflow-hidden flex flex-col relative',
        className,
      )}
    >
      {/* Colored top accent strip */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background:
            'linear-gradient(90deg, var(--ryda-yellow) 0%, var(--ryda-primary) 50%, var(--ryda-pink) 100%)',
        }}
      />
      {/* Editor chrome */}
      <div className="flex items-center gap-3 px-4 h-10 border-b border-ryda-border bg-ryda-bg-soft/60">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-ryda-yellow" />
          <span className="size-2.5 rounded-full bg-ryda-primary" />
          <span className="size-2.5 rounded-full bg-ryda-pink" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-ryda-muted">
          <FileCode2 className="size-3.5 text-ryda-primary" aria-hidden="true" />
          <span className="text-ryda-text/90 font-medium">{filename}</span>
          <span className="text-ryda-muted/70">· {language}</span>
        </div>
      </div>

      {/* Code body */}
      <pre
        className="ryda-code ryda-scrollbar m-0 p-4 sm:p-5 overflow-x-auto bg-ryda-bg text-ryda-text"
        tabIndex={0}
      >
        <code>{children}</code>
      </pre>

      {/* Caption */}
      <div className="px-4 sm:px-5 py-3 border-t border-ryda-border bg-ryda-bg-soft/40">
        <p className="text-xs sm:text-sm text-ryda-muted leading-relaxed flex gap-2">
          <span className="text-ryda-primary shrink-0" aria-hidden="true">
            {'->'}
          </span>
          <span>{comment}</span>
        </p>
      </div>
    </motion.div>
  );
}
