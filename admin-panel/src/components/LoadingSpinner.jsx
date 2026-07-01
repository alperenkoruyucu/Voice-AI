export default function LoadingSpinner({message = "Yükleniyor..."}) {
    return(
        <div className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
    );
}
