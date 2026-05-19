import { layoutStyles } from './layout';
import { cardsStyles } from './cards';
import { listStyles } from './lists';
import { formStyles } from './forms';
import { buttonStyles } from './buttons';
import { modalStyles } from './modals';
import { paginationStyles } from './pagination';

export const styles = {
    ...layoutStyles,
    ...cardsStyles,
    ...listStyles,
    ...formStyles,
    ...buttonStyles,
    ...modalStyles,
    ...paginationStyles,
};

// Added to prevent Expo Router crash
export default function DummyRoute() { return null; }

