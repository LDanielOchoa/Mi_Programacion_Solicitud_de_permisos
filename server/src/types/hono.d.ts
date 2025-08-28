import 'hono';
import { User } from './index';

declare module 'hono' {
  interface ContextVariableMap {
    currentUser: User;
    payload: { 
      sub: string; 
      iat: number;
      exp: number;
    };
  }
}
