
export const setToken = (accessToken) => {
  if (!accessToken) {
    return;
  }
  localStorage.setItem("accessToken", accessToken);
  const savedToken = localStorage.getItem("accessToken");
};

export const getToken = () => {
  return localStorage.getItem("accessToken");
};

export const deleteToken = () => {
  localStorage.removeItem("accessToken");
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};
