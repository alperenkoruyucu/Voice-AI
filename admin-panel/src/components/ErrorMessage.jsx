export default function ErrorMessage({message = "Bir hata oluştu"}) {
    return (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">
            <span className="font-medium">Hata:</span> {message}
        </div>
    );
}