import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export function PaginationControls({
    currentPage,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [50, 100, 200, 500, -1],
}: PaginationControlsProps) {
    const isAll = pageSize === -1;
    const totalPages = isAll ? 1 : Math.ceil(totalCount / pageSize);
    const startItem = isAll ? 1 : (currentPage - 1) * pageSize + 1;
    const endItem = isAll ? totalCount : Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <p>Rows per page</p>
                <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                        onPageSizeChange(Number(value));
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={isAll ? "All" : pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size === -1 ? "All" : size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="ml-2">
                    {totalCount === 0
                        ? "0 of 0"
                        : `${startItem}-${endItem} of ${totalCount}`}
                </span>
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isAll}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isAll}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
