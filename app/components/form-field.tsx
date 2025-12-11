

export default function FormField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{label}</label>
            {children}
        </div>
    );
}