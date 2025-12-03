import { useLocation } from '@tanstack/react-router';
import { useChatWindows } from '@/shared/stores/chat-windows-store';
import { ChatWindow } from './chat-window';
import { MinimizedChatButton } from './minimized-chat-button';
import { SummaryButton } from './summary-button';

const MAX_INDIVIDUAL_CHATS = 5;

export function ChatWindowsUI() {
    const location = useLocation();
    const { windows, closeChatWindow, toggleMinimize } = useChatWindows();

    const windowsArray = Array.from(windows.entries());
    const isOnMessagesPage = location.pathname === '/messages';

    if (isOnMessagesPage) {
        return null;
    }

    const minimizedWindows = windowsArray.filter(([_, state]) => state.isMinimized);
    const visibleIndividualChats = minimizedWindows.slice(0, MAX_INDIVIDUAL_CHATS);
    const hiddenChats = minimizedWindows.slice(MAX_INDIVIDUAL_CHATS);
    const showSummaryButton = hiddenChats.length > 0;

    return (
        <>
            {windowsArray
                .filter(([_, state]) => !state.isMinimized)
                .map(([userId, windowState], index) => (
                    <ChatWindow
                        key={userId}
                        user={windowState.user}
                        isMinimized={windowState.isMinimized}
                        position={index}
                        minimizedCount={visibleIndividualChats.length}
                        onClose={() => closeChatWindow(userId)}
                        onToggleMinimize={() => toggleMinimize(userId)}
                    />
                ))}

            {visibleIndividualChats.map(([userId, windowState], index) => (
                <MinimizedChatButton
                    key={userId}
                    user={windowState.user}
                    position={index}
                    onRestore={() => toggleMinimize(userId)}
                    onClose={() => closeChatWindow(userId)}
                />
            ))}

            {showSummaryButton && (
                <SummaryButton
                    hiddenCount={hiddenChats.length}
                    hiddenWindows={hiddenChats.map(([_, state]) => state)}
                    position={MAX_INDIVIDUAL_CHATS}
                    onRestoreChat={(userId) => toggleMinimize(userId)}
                    onCloseChat={(userId) => closeChatWindow(userId)}
                />
            )}
        </>
    );
}
