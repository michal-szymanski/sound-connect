import Image from 'next/image';
import { Card } from '@/components/ui/card';

const Page = () => {
    return (
        <>
            <div className="container mx-auto px-4">
                <Card className="overflow-hidden">
                    <div className="relative h-60 max-h-60">
                        <Image src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80" alt="Photo by Drew Beamer" fill />
                    </div>
                    <Image
                        src="https://github.com/shadcn.png"
                        alt="Shadcn"
                        className="relative -top-20 left-10 rounded-full object-cover"
                        width={160}
                        height={160}
                    />
                    <div>
                        <h1 className="relative -top-10 left-10 text-xl">Michał Szymański</h1>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default Page;
