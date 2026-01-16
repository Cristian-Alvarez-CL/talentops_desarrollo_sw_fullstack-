import Cookies from 'js-cookie';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const REMEMBER_ME_KEY = 'rememberMe';

class TokenStorage {
  // Guardar tokens
  static setTokens(accessToken, refreshToken, rememberMe = false) {
    if (rememberMe) {
      // Guardar en localStorage para persistencia
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      // Guardar en sessionStorage para sesión temporal
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    
    // También guardar en cookies para acceso del servidor si es necesario
    Cookies.set(TOKEN_KEY, accessToken, { 
      expires: rememberMe ? 30 : 1,
      secure: true,
      sameSite: 'strict'
    });
  }

  // Obtener access token
  static getAccessToken() {
    return localStorage.getItem(TOKEN_KEY) || 
           sessionStorage.getItem(TOKEN_KEY) ||
           Cookies.get(TOKEN_KEY);
  }

  // Obtener refresh token
  static getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || 
           sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Guardar información del usuario
  static setUser(user, rememberMe = false) {
    const userString = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(USER_KEY, userString);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      sessionStorage.setItem(USER_KEY, userString);
      sessionStorage.setItem(REMEMBER_ME_KEY, 'false');
    }
  }

  // Obtener información del usuario
  static getUser() {
    const userString = localStorage.getItem(USER_KEY) || 
                       sessionStorage.getItem(USER_KEY);
    return userString ? JSON.parse(userString) : null;
  }

  // Verificar si está en modo "recordar sesión"
  static isRememberMe() {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  }

  // Eliminar todos los datos de autenticación
  static clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(REMEMBER_ME_KEY);
    
    Cookies.remove(TOKEN_KEY);
  }

  // Verificar si hay tokens guardados
  static hasTokens() {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
}

export default TokenStorage;