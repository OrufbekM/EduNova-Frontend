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

  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'toast-content';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'toast-title';
  titleSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1);

  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.innerHTML = '&times;';
  closeButton.onclick = () => removeToast(toast);

  content.appendChild(titleSpan);
  content.appendChild(messageSpan);
  toast.appendChild(iconSpan);
  toast.appendChild(content);
  toast.appendChild(closeButton);
  container.appendChild(toast);

  // Auto remove after duration (skip when duration is falsy or <= 0)
  if (duration && duration > 0) {
    const timeoutId = setTimeout(() => removeToast(toast), duration);
    toast.dataset.timeoutId = String(timeoutId);
  }

  return toast;
};

const removeToast = (toast) => {
  if (!toast || toast.dataset.removing === 'true') return;

  toast.dataset.removing = 'true';
  const timeoutId = toast.dataset.timeoutId;
  if (timeoutId) {
    clearTimeout(Number(timeoutId));
    toast.dataset.timeoutId = '';
  }

  toast.classList.add('removing');
  setTimeout(() => {
    if (!toast.isConnected) return;
    try {
      toast.remove();
    } catch {
      if (toast.parentNode && toast.parentNode.contains(toast)) {
        toast.parentNode.removeChild(toast);
      }
    }
  }, 300);
};

export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
  loading: (message = 'Loading...') => showToast(message, 'loading', 0),
  remove: removeToast
};
