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

export const createLesson = async (classId, name, text = null, image = null, video = null) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('classId', classId);
  if (text !== null && text !== undefined && text !== '') formData.append('text', text);
  if (image) formData.append('image', image);
  if (video) formData.append('video', video);

  const response = await apiClient.post('/lesson/create', formData);

  return { success: true, data: response };
};

export const updateLesson = async (classId, lessonId, name, text = null, image = null, video = null) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('classId', classId);
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
