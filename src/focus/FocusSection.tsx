import {
  FocusContext,
  useFocusable,
  type UseFocusableConfig,
} from "@noriginmedia/norigin-spatial-navigation";
import type { CSSProperties, ReactNode } from "react";

export interface FocusSectionProps
  extends Omit<UseFocusableConfig, "trackChildren" | "focusable"> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** When true, focus stays inside this section (used for modals). */
  isFocusBoundary?: boolean;
}

/**
 * Logical focus region. Children that mount Focusable will be grouped under this
 * context, so Norigin can prefer in-section neighbours over outside candidates.
 * Pass isFocusBoundary to trap focus (e.g. modal/drawer).
 */
export function FocusSection({
  children,
  className,
  style,
  isFocusBoundary,
  ...config
}: FocusSectionProps) {
  const { ref, focusKey } = useFocusable({
    ...config,
    focusable: false,
    trackChildren: true,
    isFocusBoundary,
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref as never} className={className} style={style}>
        {children}
      </div>
    </FocusContext.Provider>
  );
}
