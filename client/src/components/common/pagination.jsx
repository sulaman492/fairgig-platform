import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    const { page, totalPages, hasNextPage, hasPrevPage } = pagination;
    
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (page <= 3) {
            for (let i = 1; i <= maxVisible; i++) pages.push(i);
        } else if (page >= totalPages - 2) {
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
        } else {
            for (let i = page - 2; i <= page + 2; i++) pages.push(i);
        }
        
        return pages;
    };
    
    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrevPage}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNextPage}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{page}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={!hasPrevPage}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {getPageNumbers().map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                    pageNum === page
                                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={!hasNextPage}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}