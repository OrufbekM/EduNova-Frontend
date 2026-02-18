import apiClient from '../services/api-Client';

const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getCategories = async () => {
  const categoriesResponse = await apiClient.get('/class-category');
  const classesResponse = await apiClient.get('/class');

  const categories = normalizeArray(categoriesResponse);
  const classes = normalizeArray(classesResponse);

  const merged = categories.map((category) => ({
    ...category,
    classes: classes.filter((cls) => cls.categoryId === category.id)
  }));

  return { success: true, data: merged };
};

export const createCategory = async (name) => {
  const response = await apiClient.post('/class-category/create', { name });
  const category = response?.data ?? response;
  return { success: true, data: { ...category, classes: [] } };
};

export const updateCategory = async (id, name) => {
  const response = await apiClient.put(`/class-category/${id}/update`, { name });
  const category = response?.data ?? response;
  return { success: true, data: category };
};

export const deleteCategory = async (id) => {
  await apiClient.delete(`/class-category/${id}/delete`);
  return { success: true };
};

export const createClass = async (categoryId, name, description = '') => {
  const response = await apiClient.post('/class/create', {
    name,
    description,
    categoryId
  });
  return { success: true, data: response };
};

export const updateClass = async (categoryId, classId, name, description = '') => {
  const response = await apiClient.put(`/class/${classId}/update`, {
    name,
    description,
    categoryId
  });
  return { success: true, data: response };
};

export const deleteClass = async (categoryId, classId) => {
  await apiClient.delete(`/class/${classId}/delete`);
  return { success: true };
};

// Reorder classes within a category.
// Backend does not currently expose a reorder endpoint, so we keep UI order locally.
export const reorderClasses = async () => {
  return { success: true };
};
