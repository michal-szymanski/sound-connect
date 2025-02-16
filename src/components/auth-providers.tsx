'use client';

import { Button } from '@/components/ui/button';
import { useSignIn } from '@clerk/nextjs';
import { OAuthStrategy } from '@clerk/types';
import Image from 'next/image';

const AuthProviders = () => {
    const { signIn } = useSignIn();

    const signInWith = (strategy: OAuthStrategy) => {
        if (!signIn) return;

        return signIn
            .authenticateWithRedirect({
                strategy,
                redirectUrl: '/auth/sso-callback',
                redirectUrlComplete: '/'
            })
            .then((res) => {
                console.log(res);
            })
            .catch((err) => {
                // See https://clerk.com/docs/custom-flows/error-handling
                // for more info on error handling
                console.log(err.errors);
                console.error(err, null, 2);
            });
    };

    return (
        <Button type="button" variant="outline" onClick={() => signInWith('oauth_spotify')}>
            <Image src="/Spotify_Full_Logo_RGB_Green.png" width={80} height={22} alt="Spotify" priority />
        </Button>
    );
};

export default AuthProviders;
