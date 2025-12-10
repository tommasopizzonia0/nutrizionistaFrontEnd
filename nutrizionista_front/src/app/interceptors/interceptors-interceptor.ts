import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔐 INTERCEPTOR CHIAMATO PER:', req.url);
  
  const token = localStorage.getItem('token');
  console.log('🎫 Token:', token ? `SI (${token.substring(0, 30)}...)` : 'NO');
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Header Authorization aggiunto');
    return next(clonedRequest);
  }
  
  console.log('❌ Nessun token - richiesta senza auth');
  return next(req);
};