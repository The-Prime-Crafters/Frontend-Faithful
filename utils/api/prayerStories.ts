import { API_ENDPOINTS } from '@/constants/API';
import * as SecureStore from 'expo-secure-store';

export async function fetchPrayerStories(signal: AbortSignal) {
  const token = await SecureStore.getItemAsync('authToken');
  if (!token) return [];
  const response = await fetch(API_ENDPOINTS.PRAYER_REQUESTS, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    signal,
  });
  if (!response.ok) return [];
  const data = await response.json();
  let requests = null;
  if (data.data && data.data.requests) {
    requests = data.data.requests;
  } else if (data.requests) {
    requests = data.requests;
  } else if (data.data && Array.isArray(data.data)) {
    requests = data.data;
  } else if (Array.isArray(data)) {
    requests = data;
  }
  if (!requests || !Array.isArray(requests)) return [];
  const allPrayers = requests.map((prayer: any) => ({
    id: prayer.id,
    userId: prayer.user_id,
    userName: prayer.is_anonymous ? 'Anonymous' : (prayer.display_name || prayer.author_name || 'Anonymous'),
    userPicture: prayer.is_anonymous ? null : (prayer.display_picture || prayer.author_picture),
    title: prayer.title,
    description: prayer.description,
    content: prayer.description || prayer.title || 'Prayer request',
    createdAt: prayer.created_at,
    responsesCount: prayer.response_count || 0,
    isAnonymous: prayer.is_anonymous || false,
    category: prayer.category,
    isUrgent: prayer.is_urgent || false,
    status: prayer.status,
    fullPrayerData: prayer
  }));
  const groupedStories = new Map();
  allPrayers.forEach((prayer: any) => {
    const groupKey = prayer.isAnonymous ? `anonymous_${prayer.id}` : `user_${prayer.userId}`;
    if (!groupedStories.has(groupKey)) {
      groupedStories.set(groupKey, {
        groupId: groupKey,
        userId: prayer.userId,
        userName: prayer.userName,
        userPicture: prayer.userPicture,
        isAnonymous: prayer.isAnonymous,
        stories: []
      });
    }
    groupedStories.get(groupKey).stories.push(prayer);
  });
  const stories = Array.from(groupedStories.values())
    .map(group => ({
      ...group,
      stories: group.stories.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      id: group.stories[0].id,
      title: group.stories[0].title,
      description: group.stories[0].description,
      content: group.stories[0].content,
      createdAt: group.stories[0].createdAt,
      responsesCount: group.stories[0].responsesCount,
      category: group.stories[0].category,
      isUrgent: group.stories[0].isUrgent,
      status: group.stories[0].status,
      fullPrayerData: group.stories[0].fullPrayerData
    }))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  return stories;
}
