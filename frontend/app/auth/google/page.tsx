import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OAuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    const { token } = router.query;

    if (token) {
      localStorage.setItem('token', token as string);

      //  redirect ไปหน้า main
      router.push('/profile/setup');
    }
  }, [router]);

  return <p>Logging in...</p>;
}
