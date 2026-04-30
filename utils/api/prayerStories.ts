import { API_ENDPOINTS } from '@/constants/API';
import * as SecureStore from 'expo-secure-store';

type PrayerStory = {
  id: number | string;
  userId?: number | string;
  userName: string;
  userPicture?: string | null;
  isAnonymous: boolean;
  title?: string;
  description?: string;
  content: string;
  createdAt?: string;
  category?: string;
};

const mapPrayerRequestToStory = (request: any): PrayerStory => {
  const isAnonymous = Boolean(request?.is_anonymous);
  const displayName =
    request?.display_name ||
    request?.author_name ||
    request?.userName ||
    request?.user_name ||
    'Unknown';

  return {
    id: request?.id ?? `${request?.created_at ?? Date.now()}`,
    userId: request?.author_id ?? request?.user_id,
    userName: isAnonymous ? 'Anonymous' : displayName,
    userPicture: request?.display_picture || request?.author_picture || request?.userPicture || null,
    isAnonymous,
    title: request?.title,
    description: request?.description,
    content: request?.description || request?.content || '',
    createdAt: request?.created_at,
    category: request?.category,
  };
};

export async function fetchPrayerStories(signal: AbortSignal): Promise<PrayerStory[]> {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('limit', '12');
    queryParams.append('sort', 'newest');
    queryParams.append('status', 'Active');
    queryParams.append('is_public', 'true');

    const response = await fetch(`${API_ENDPOINTS.PRAYER_REQUESTS}?${queryParams}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (!response.ok) return [];

    const result = await response.json();
    const requests = result?.data?.requests || result?.requests || [];
    if (!Array.isArray(requests)) return [];

    return requests.map(mapPrayerRequestToStory);
  } catch (error: any) {
    if (error?.name === 'AbortError') return [];
    return [];
  }
}
