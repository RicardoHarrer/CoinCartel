import { jwtDecode } from 'jwt-decode';

export const auth = {
  getToken() {
    return sessionStorage.getItem('token');
  },

  setToken(token) {
    sessionStorage.setItem('token', token);
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { isAuthenticated: true } }));
  },

  removeToken() {
    sessionStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth-change', { detail: { isAuthenticated: false } }));
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const isValid = decoded.exp > Date.now() / 1000;
      if (!isValid) {
        this.removeToken(); 
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.removeToken(); 
      return false;
    }
  },


  onAuthChange(callback) {
    const handler = (event) => callback(event.detail.isAuthenticated);
    window.addEventListener('auth-change', handler);

    return () => {
      window.removeEventListener('auth-change', handler);
    };
  }
};