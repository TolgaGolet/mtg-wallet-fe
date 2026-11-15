import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top when the path changes. Keyed by pathname on purpose: paging (`?page=`) and
 * filters (`?filter=`) keep the position. Back doesn't restore the old position, since lists load
 * their data after mount and the page is too short to scroll to it yet.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
