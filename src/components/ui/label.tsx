'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Label — shadcn/ui New York style.
 *
 * Vendored minimal version of `@radix-ui/react-label`. Forwards `htmlFor`
 * to the underlying `<label>` so a click on the label focuses the linked
 * input — essential for keyboard + screen-reader accessibility.
 *
 * The `peer-disabled:...` Tailwind classes work when this label is a sibling
 * of a `peer` input; the input sets `peer-disabled` itself when disabled.
 */
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    data-slot="label"
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
