import { test as base, Page } from "@playwright/test";
import { ApiClient, createApiClient } from "./api-client";
import { login, UserKey } from "./auth";

type Fixtures = {
  dnaPage: Page;
  pdPage: Page;
  icPage: Page;
  apiDna: ApiClient;
  apiDnaViewOnly: ApiClient;
  apiPd: ApiClient;
  apiIc: ApiClient;
  apiMinistry: ApiClient;
};

async function loggedInPage(page: Page, user: UserKey): Promise<Page> {
  await login(page, user);
  return page;
}

export const test = base.extend<Fixtures>({
  dnaPage: async ({ page }, use) => {
    await use(await loggedInPage(page, "dnaAdmin"));
  },
  pdPage: async ({ page }, use) => {
    await use(await loggedInPage(page, "pdAdmin"));
  },
  icPage: async ({ page }, use) => {
    await use(await loggedInPage(page, "icAdmin"));
  },
  apiDna: async ({}, use) => {
    const api = await createApiClient("dnaAdmin");
    await use(api);
    await api.request.dispose();
  },
  apiPd: async ({}, use) => {
    const api = await createApiClient("pdAdmin");
    await use(api);
    await api.request.dispose();
  },
  apiIc: async ({}, use) => {
    const api = await createApiClient("icAdmin");
    await use(api);
    await api.request.dispose();
  },
  apiMinistry: async ({}, use) => {
    const api = await createApiClient("ministryAdmin");
    await use(api);
    await api.request.dispose();
  },
  apiDnaViewOnly: async ({}, use) => {
    const api = await createApiClient("dnaViewOnly");
    await use(api);
    await api.request.dispose();
  },
});

export { expect } from "@playwright/test";
