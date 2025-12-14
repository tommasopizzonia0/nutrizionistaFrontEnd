import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  
  const token = localStorage.getItem('token');


  //lo stampo per prova poi si rimuove
  console.log('🎫 Token:', token ? `SI (${token.substring(0, 30)}...)` : 'NO');
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    //lo stampo per prova poi si rimuove
    console.log('✅ Header Authorization aggiunto');
    return next(clonedRequest);
  }
  
  console.log('❌ Nessun token - richiesta senza auth');
  return next(req);
};