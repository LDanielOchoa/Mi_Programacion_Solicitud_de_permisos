interface UserData {
  code: string;
  name: string;
  cargo?: string;
  phone?: string;
}

declare module '@/hooks/useUserData' {
  export interface UseUserDataResult {
    userData: UserData | null;
    isLoading: boolean;
    error: string | null;
    fetchUserData: () => Promise<UserData | null>;
    clearUserData: () => void;
  }

  export default function useUserData(): UseUserDataResult;
} 