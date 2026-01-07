import { useCallback } from "react";

export function useEnterKeyNavigation() {
    const handleKeyDown = useCallback((e: React.KeyboardEvent, nextSelector: string, select: boolean = false) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const nextElement = document.querySelector(nextSelector) as HTMLElement;
            if (nextElement) {
                nextElement.focus();
                if (select && (nextElement instanceof HTMLInputElement || nextElement instanceof HTMLTextAreaElement)) {
                    (nextElement as HTMLInputElement).select();
                }
            }
        }
    }, []);


    return { handleKeyDown };
}
