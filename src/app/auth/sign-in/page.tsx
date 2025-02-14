import AuthProviders from '@/components/auth-providers';

const Page = async () => {
    return (
        <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <h1 className="text-center text-2xl font-semibold tracking-tight">Sign in</h1>
                    <div className="grid gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">CONTINUE WITH</span>
                            </div>
                        </div>
                        <AuthProviders />
                    </div>
                </div>
                <div id="clerk-captcha" />
            </div>
        </div>
    );
};

export default Page;
