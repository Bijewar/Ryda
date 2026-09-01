import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Minimal Slot — clones the single child element and merges props, mirroring
 * the API of `@radix-ui/react-slot`. We vendor it here so the shadcn Button
 * doesn't pull in a Radix dep that isn't otherwise needed.
 *
 * Used by `<Button asChild>` to delegate rendering to a single child
 * (e.g. `<Button asChild><Link href=...>Sign in</Link></Button>`).
 */
type SlotProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode };

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (!React.isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  return React.cloneElement(child, {
    ...props,
    ...child.props,
    ref: ref
      ? (node: HTMLElement) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      : (child.props as { ref?: React.Ref<HTMLElement> }).ref,
    className: cn(props.className, (child.props as { className?: string }).className),
  });
});
Slot.displayName = 'Slot';

/**
 * Button — shadcn/ui New York style.
 *
 * Variants cover the standard set (default / destructive / outline / secondary
 * / ghost / link). Sizes match the shadcn defaults plus `icon` for square
 * icon-only buttons (44×44 touch target on mobile).
 *
 * `asChild` delegates rendering to a single child element (used by `<Link>`).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? (Slot as React.ElementType) : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        data-slot="button"
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
