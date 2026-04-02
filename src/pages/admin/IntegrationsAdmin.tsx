import { Navigate } from "react-router-dom";

/**
 * Redirects to the unified settings page (Tracking tab).
 * This page was a frontend-only placeholder and has been consolidated.
 */
export default function IntegrationsAdmin() {
  return <Navigate to="/admin/settings" replace />;
}
