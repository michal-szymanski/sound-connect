'use client';

import { Button } from '@/components/ui/button';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { OAuthStrategy } from '@clerk/types';
import Image from 'next/image';

const AuthProviders = () => {
    const { signIn } = useSignIn();
    const { signUp } = useSignUp();

    if (!signIn || !signUp) return null;

    const signInWith = (strategy: OAuthStrategy) => {
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
            <div className="relative size-20">
                <Image src="/Spotify_Full_Logo_RGB_Green.png" alt="Spotify" fill priority className="object-contain" />
            </div>
        </Button>
    );
};

export default AuthProviders;
