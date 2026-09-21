// Small, non-JSX bits shared across the InitialReport pages (list,
// detail/versions, version view, draft).

export const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
};

export const versionLabel = (major?: number | string, minor?: number | string) =>
  `v${major ?? 0}.${minor ?? 0}`;

// A frozen version's snapshot uses `details` for what the live link rows
// call `cooperativeApproachDetails` — normalize the two into one shape so
// InitialReportApproachesTable doesn't need to know which one it's fed.
export const normalizeVersionSnapshot = (version: any) => ({
  general: version?.snapshot?.general ?? {},
  approaches: (version?.snapshot?.cooperativeApproaches ?? []).map((a: any) => ({
    cooperativeApproachId: a.cooperativeApproachId,
    addedInMajor: a.addedInMajor,
    cooperativeApproachDetails: a.details,
    authorizedEntities: a.authorizedEntities ?? [],
  })),
});
