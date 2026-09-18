import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../../Definitions/Enums/company.role.enum";
import { Role } from "../../../Definitions/Enums/role.enum";

// Shared permission gate for the Article 6 government-reporting
// features — Cooperative Approaches, Initial Reports, Corresponding
// Adjustments — and the AEF report, which follows the identical rule.
// Mirrors the backend's assertCanManage on each of
// CooperativeApproachService / InitialReportService /
// CorrespondingAdjustmentService, and the Manage(AefReport) grant in
// casl-ability.factory.ts: only a Designated National Authority (DNA)
// company may use these at all; within DNA, only Root/Admin can view
// and add/submit — Manager is view-only here too, unlike the rest of
// the DNA permission surface (casl-ability.factory.ts's DNA block
// grants Manager everything else, but carves these subjects out to
// Root/Admin specifically).
//
// Corresponding Adjustment has one further wrinkle not captured here —
// ViewOnly (and Manager) may calculate/preview (nothing is persisted)
// even though neither can save or submit. That distinction is specific
// to the calculation page and is handled there via `canView` alone, not
// by this hook's `canManage`.
export function useArticle6Permissions() {
  const { userInfoState } = useUserContext();
  const canView =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY;
  const canManage =
    canView &&
    (userInfoState?.userRole === Role.Root ||
      userInfoState?.userRole === Role.Admin);
  return { canView, canManage };
}
