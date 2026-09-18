import { Result } from "antd";
import { useArticle6Permissions } from "../hooks/useArticle6Permissions";

// Blocks a non-DNA company from ever rendering a Cooperative Approach /
// Initial Report / Corresponding Adjustment page. The sidebar already
// hides these for other companies (see layout.sider.tsx) and the
// backend rejects their API calls (see each service's assertCanManage /
// assertCanView) — this is the third layer, for someone who navigates
// straight to the URL: a clear message instead of a page stuck loading
// against calls that will only ever 403.
const RequireDnaAccess: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { canView } = useArticle6Permissions();
  if (!canView) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Only a Designated National Authority (DNA) user can access this page."
      />
    );
  }
  return <>{children}</>;
};

export default RequireDnaAccess;

// Stricter variant for pages that only ever add/edit (no read-only mode
// to fall back to) — a generate/create form, say. DNA-ViewOnly/Manager
// can look at a filled-in record on a detail page, but there is nothing
// for either to "view" on a blank create form, so this blocks both, not
// just non-DNA companies.
export const RequireDnaManage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { canManage } = useArticle6Permissions();
  if (!canManage) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Only a Designated National Authority (DNA) Root or Admin user can access this page."
      />
    );
  }
  return <>{children}</>;
};
