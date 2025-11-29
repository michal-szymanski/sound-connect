import { MusicPortfolioSection } from '../music-portfolio-section';

type Props = {
    userId: string;
    canEdit: boolean;
};

export function PortfolioTab({ userId, canEdit }: Props) {
    return <MusicPortfolioSection userId={userId} canEdit={canEdit} />;
}
