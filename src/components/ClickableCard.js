import { Card } from "@mantine/core";
import { Link } from "react-router-dom";
import cx from "clsx";
import classes from "./ClickableCard.module.css";

/**
 * A card that can be used with mouse, keyboard and screen readers.
 * With `to` it is a real link (middle-click and "open in new tab" work); with `onClick` it acts
 * as a button (Tab to focus, Enter or Space to activate). Always pass an `aria-label`.
 */
export default function ClickableCard({ to, onClick, className, ...props }) {
  if (to) {
    return (
      <Card
        component={Link}
        to={to}
        className={cx(classes.card, className)}
        {...props}
      />
    );
  }
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cx(classes.card, className)}
      {...props}
    />
  );
}
