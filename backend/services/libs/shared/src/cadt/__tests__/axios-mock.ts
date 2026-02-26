import axios from "axios";

jest.mock("axios");

interface RecordedCall {
  method: string;
  url: string;
  data: any;
  headers: any;
}

export function createAxiosMock() {
  const calls: RecordedCall[] = [];
  const responses: Record<string, any> = {};

  const mockedAxios = axios as jest.MockedFunction<typeof axios>;
  mockedAxios.mockImplementation(async (config: any) => {
    const call: RecordedCall = {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
    };
    calls.push(call);

    const matchingKey = Object.keys(responses).find(
      (k) => config.url?.includes(k)
    );
    if (matchingKey) {
      return { data: responses[matchingKey], status: 200 };
    }

    return { data: { uuid: `mock-uuid-${calls.length}` }, status: 200 };
  });

  return {
    mock: mockedAxios,
    calls,
    setResponse(endpoint: string, response: any) {
      responses[endpoint] = response;
    },
    reset() {
      calls.length = 0;
      Object.keys(responses).forEach((k) => delete responses[k]);
      mockedAxios.mockClear();
    },
  };
}
