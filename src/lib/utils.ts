import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Formats a date string to dd-MM-yyyy format
 * @param dateString - ISO date string or yyyy-MM-dd format
 * @returns Formatted date string in dd-MM-yyyy format
 */
export function formatDate(dateString: string): string {
    if (!dateString) return "";
    try {
        // Handle both ISO strings and yyyy-MM-dd format
        const date = dateString.includes("T") ? parseISO(dateString) : parseISO(dateString);
        return format(date, "dd-MM-yyyy");
    } catch {
        return dateString;
    }
}
