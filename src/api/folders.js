import apiClient from '../services/api-Client';

const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getFolders = async (classId) => {
  const response = await apiClient.get(`/folder`, { params: { classId } });
  return { success: true, data: normalizeArray(response) };
};

export const createFolder = async (classId, name, parentId = null, orderIndex = null) => {
  const payload = { name, classId };
  if (parentId !== null && parentId !== undefined) payload.parentId = parentId;
  if (orderIndex !== null && orderIndex !== undefined) payload.orderIndex = orderIndex;
  const response = await apiClient.post('/folder/create', payload);
  return { success: true, data: response };
};

export const updateFolder = async (folderId, name) => {
  const response = await apiClient.put(`/folder/${folderId}/update`, { name });
  return { success: true, data: response };
};

export const deleteFolder = async (folderId) => {
  await apiClient.delete(`/folder/${folderId}/delete`);
  return { success: true };
};

export const reorderFolder = async (folderId, orderIndex) => {
  const response = await apiClient.put(`/folder/${folderId}/reorder`, { orderIndex });
  return { success: true, data: response };
};

export const moveFolder = async (folderId, { classId, parentId, orderIndex } = {}) => {
  const payload = {};
  if (classId !== undefined) payload.classId = classId;
  if (parentId !== undefined) payload.parentId = parentId;
  if (orderIndex !== undefined) payload.orderIndex = orderIndex;
  const response = await apiClient.put(`/folder/${folderId}/move`, payload);
  return { success: true, data: response };
};
