import apiClient from '../services/api-Client';

const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getLessons = async (classId) => {
  const response = await apiClient.get('/lesson');
  const lessons = normalizeArray(response);
  const filtered = classId
    ? lessons.filter((lesson) => String(lesson.classId) === String(classId))
    : lessons;

  return { success: true, data: filtered };
};

export const createLesson = async (classId, name, text = null, image = null, video = null, folderId = null) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('classId', classId);
  if (folderId !== null && folderId !== undefined) formData.append('folderId', folderId);
  if (text !== null && text !== undefined && text !== '') formData.append('text', text);
  if (image) formData.append('image', image);
  if (video) formData.append('video', video);

  const response = await apiClient.post('/lesson/create', formData);

  return { success: true, data: response };
};

export const updateLesson = async (classId, lessonId, name, text = null, image = null, video = null, folderId = null) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('classId', classId);
  if (folderId !== null && folderId !== undefined) formData.append('folderId', folderId);
  if (text !== null && text !== undefined && text !== '') formData.append('text', text);
  if (image) formData.append('image', image);
  if (video) formData.append('video', video);

  const response = await apiClient.put(`/lesson/${lessonId}/update`, formData);

  return { success: true, data: response };
};

export const deleteLesson = async (classId, lessonId) => {
  await apiClient.delete(`/lesson/${lessonId}/delete`);
  return { success: true };
};

export const getLessonById = async (lessonId) => {
  const response = await apiClient.get(`/lesson/${lessonId}`);
  return { success: true, data: response };
};

const parseLessonContent = (lesson) => {
  if (!lesson || !lesson.text) return [];
  try {
    const parsed = JSON.parse(lesson.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getLessonContent = async (classId, lessonId) => {
  const result = await getLessonById(lessonId);
  if (!result.success) {
    return result;
  }

  const lesson = result.data?.data || result.data;
  return { success: true, data: { content: parseLessonContent(lesson) } };
};

export const updateLessonContent = async (classId, lessonId, content) => {
  const result = await getLessonById(lessonId);
  const lesson = result.data?.data || result.data || {};
  const name = lesson.name || 'Untitled';
  const text = JSON.stringify(content || []);

  const updateResult = await updateLesson(classId, lessonId, name, text);
  return updateResult;
};

export const updateItemStyle = async () => {
  return { success: true };
};

export const getLessonMedia = async (lessonId) => {
  const response = await apiClient.get(`/lesson/${lessonId}/media`);
  return { success: true, data: response };
};

export const createLessonMedia = async (lessonId, { file, url, type } = {}) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (url) {
    formData.append('url', url);
  }
  if (type) {
    formData.append('type', type);
  }
  const response = await apiClient.post(`/lesson/${lessonId}/media/create`, formData);
  return { success: true, data: response };
};

export const updateLessonMedia = async (lessonId, mediaId, { file, url, type } = {}) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (url) {
    formData.append('url', url);
  }
  if (type) {
    formData.append('type', type);
  }
  const response = await apiClient.put(`/lesson/${lessonId}/media/${mediaId}/update`, formData);
  return { success: true, data: response };
};

export const deleteLessonMedia = async (lessonId, mediaId) => {
  await apiClient.delete(`/lesson/${lessonId}/media/${mediaId}/delete`);
  return { success: true };
};
