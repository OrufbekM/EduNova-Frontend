let toastContainer = null;

const createToastContainer = () => {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  return toastContainer;
};

const showToast = (message, type = 'success', duration = 3000) => {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.innerHTML = '×';
  closeButton.onclick = () => removeToast(toast);
  
  toast.appendChild(messageSpan);
  toast.appendChild(closeButton);
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => removeToast(toast), duration);
  
  return toast;
};

const removeToast = (toast) => {
  if (!toast || !toast.parentNode) return;
  
  toast.classList.add('removing');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
};

export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  remove: removeToast
};
