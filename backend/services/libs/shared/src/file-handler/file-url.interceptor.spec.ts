import { of, lastValueFrom } from "rxjs";
import { FileUrlInterceptor } from "./file-url.interceptor";
import { FileHandlerInterface } from "./filehandler.interface";
import { toStorageKey, isStorageKey } from "./storage-key";

const BLOB = "https://undpregtest.blob.core.windows.net/files";

const fileHandler = {
  uploadFile: jest.fn(),
  getUrl: jest.fn(async (key: string) => `${BLOB}/${key}`),
} as unknown as FileHandlerInterface;

const run = (payload: any) => {
  const interceptor = new FileUrlInterceptor(fileHandler);
  return lastValueFrom(
    interceptor.intercept({} as any, { handle: () => of(payload) } as any)
  );
};

describe("FileUrlInterceptor", () => {
  it("resolves a bare storage key", async () => {
    expect(await run({ logo: "profile_images/353_1788.png" })).toEqual({
      logo: `${BLOB}/profile_images/353_1788.png`,
    });
  });

  it("leaves legacy absolute URLs untouched", async () => {
    const legacy =
      "https://carbon-common-dev.s3.amazonaws.com/profile_images%2F159_175.png";
    expect(await run({ logo: legacy })).toEqual({ logo: legacy });
  });

  it("resolves keys nested in arrays and jsonb-shaped objects", async () => {
    const result = await run({
      data: {
        content: {
          appendix: { appendix1Documents: ["documents/PDD_1.pdf"] },
          projectActivity: {
            locationsOfProjectActivity: [
              { additionalDocuments: ["documents/LOC_1.pdf"] },
            ],
          },
        },
        companies: [{ logo: "profile_images/1.png" }],
      },
    });

    expect(result.data.content.appendix.appendix1Documents[0]).toBe(
      `${BLOB}/documents/PDD_1.pdf`
    );
    expect(
      result.data.content.projectActivity.locationsOfProjectActivity[0]
        .additionalDocuments[0]
    ).toBe(`${BLOB}/documents/LOC_1.pdf`);
    expect(result.data.companies[0].logo).toBe(`${BLOB}/profile_images/1.png`);
  });

  it("does not rewrite strings that are not storage keys", async () => {
    const payload = {
      name: "Documents of record",
      note: "see documents",
      path: "reports/summary.pdf",
      count: 4,
      flag: true,
      nothing: null,
    };
    expect(await run({ ...payload })).toEqual(payload);
  });

  it("terminates on circular entity graphs", async () => {
    const company: any = { logo: "profile_images/9.png" };
    const project: any = { company, title: "P" };
    company.projects = [project];

    const result = await run({ project });
    expect(result.project.company.logo).toBe(`${BLOB}/profile_images/9.png`);
  });

  it("preserves Dates and does not recurse into them", async () => {
    const when = new Date("2026-01-01T00:00:00Z");
    const result = await run({ when, url: "documents/x.pdf" });
    expect(result.when).toBe(when);
    expect(result.url).toBe(`${BLOB}/documents/x.pdf`);
  });
});

describe("toStorageKey", () => {
  it("recovers the key from a resolved URL the client echoed back", () => {
    expect(toStorageKey(`${BLOB}/documents/LOA_1.pdf`)).toBe(
      "documents/LOA_1.pdf"
    );
  });

  it("is idempotent on a value that is already a key", () => {
    expect(toStorageKey("documents/LOA_1.pdf")).toBe("documents/LOA_1.pdf");
  });

  it("recovers keys from any backend's URL shape", () => {
    expect(
      toStorageKey("http://localhost:3000/profile_images/1.png")
    ).toBe("profile_images/1.png");
    expect(
      toStorageKey("https://b.s3.amazonaws.com/documents/exports/r.csv")
    ).toBe("documents/exports/r.csv");
  });

  it("leaves legacy percent-encoded S3 URLs alone rather than mangling them", () => {
    const legacy =
      "https://carbon-common-dev.s3.amazonaws.com/profile_images%2F159_175.png";
    expect(toStorageKey(legacy)).toBe(legacy);
  });

  it("does not claim an unrelated URL that merely contains a prefix substring", () => {
    const foreign = "https://example.org/mydocuments/report.pdf";
    expect(toStorageKey(foreign)).toBe(foreign);
    const foreign2 = "https://example.org/xprofile_images/a.png";
    expect(toStorageKey(foreign2)).toBe(foreign2);
  });

  it("still recovers a key when the prefix is a real path segment", () => {
    expect(toStorageKey("https://example.org/a/b/documents/report.pdf")).toBe(
      "documents/report.pdf"
    );
  });

  it("leaves unrelated values alone", () => {
    expect(toStorageKey("data:image/png;base64,AAAA")).toBe(
      "data:image/png;base64,AAAA"
    );
    expect(toStorageKey("")).toBe("");
  });
});

describe("isStorageKey", () => {
  it.each([
    ["documents/a.pdf", true],
    ["documents/exports/a.csv", true],
    ["profile_images/a.png", true],
    ["signatures/ceo.jpg", true],
    ["https://x/documents/a.pdf", false],
    ["reports/a.pdf", false],
    ["documents", false],
  ])("%s -> %s", (value, expected) => {
    expect(isStorageKey(value as string)).toBe(expected);
  });
});
