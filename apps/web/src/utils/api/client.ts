/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API 클라이언트 유틸리티
 * Authorization 헤더를 자동으로 추가하고 에러 핸들링을 제공합니다.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * localStorage에서 access token을 가져옵니다.
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

/**
 * localStorage에 access token을 저장합니다.
 */
export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
};

/**
 * localStorage에서 access token을 제거합니다.
 */
export const clearAccessToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
};

/**
 * 인증된 API 요청을 수행합니다.
 * Authorization 헤더와 credentials를 자동으로 추가합니다.
 */
export const apiClient = async (
  endpoint: string,
  options: FetchOptions = {},
): Promise<Response> => {
  const { params, headers, ...restOptions } = options;

  // URL 생성
  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // 헤더 설정
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Access token 추가
  const accessToken = getAccessToken();
  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  // 요청 수행
  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
    credentials: 'include', // refresh token cookie 전송
  });

  return response;
};

/**
 * JSON 응답을 자동으로 파싱하는 API 요청
 */
export const apiClientJson = async <T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const response = await apiClient(endpoint, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error [${endpoint}]:`, errorText);
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
