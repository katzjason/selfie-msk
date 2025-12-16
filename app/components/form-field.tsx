

export default function FormField({ label, requiredFlag, children }: { label: string, requiredFlag: boolean, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
            <div className="flex flex-row gap-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{label}</label>
                {requiredFlag && (<div className="block text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">*Required</div>)}
            </div>
            {children}
        </div>
    );
}