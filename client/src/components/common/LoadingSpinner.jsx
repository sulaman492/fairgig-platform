export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };
    
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
            {message && <p className="mt-3 text-gray-500 text-sm">{message}</p>}
        </div>
    );
}