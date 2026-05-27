import { useFocusable, type UseFocusableConfig } from "@noriginmedia/norigin-spatial-navigation";
import type { CSSProperties, ReactNode } from "react";

export interface FocusableProps
  extends Omit<UseFocusableConfig, "onEnterPress" | "onArrowPress"> {
  children: ReactNode | ((args: { focused: boolean }) => ReactNode);
  className?: string;
  style?: CSSProperties;
  tag?: "div" | "button" | "li" | "a";
  onPress?: () => void;
  onArrowPress?: UseFocusableConfig["onArrowPress"];
  /** Optional design-pixel position helpers — laid out absolutely inside <Stage>. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Thin wrapper around Norigin's useFocusable. Renders a focusable DOM node,
 * forwards focus state to children via render-prop, and exposes onPress / onArrowPress.
 */
export function Focusable({
  children,
  className,
  style,
  tag = "div",
  onPress,
  onArrowPress,
  x,
  y,
  width,
  height,
  ...config
}: FocusableProps) {
  const { ref, focused, focusSelf } = useFocusable({
    ...config,
    onEnterPress: onPress,
    onArrowPress,
  });

  const Tag = tag as "div";

  const handleClick = () => {
    focusSelf();
    onPress?.();
  };

  const positional: CSSProperties =
    x !== undefined || y !== undefined || width !== undefined || height !== undefined
      ? { position: "absolute", left: x, top: y, width, height }
      : {};

  return (
    <Tag
      ref={ref as never}
      tabIndex={-1}
      onClick={handleClick}
      data-focused={focused || undefined}
      className={className}
      style={{ outline: "none", ...positional, ...style }}
    >
      {typeof children === "function" ? children({ focused }) : children}
    </Tag>
  );
}
