


export default function EnlargedImage({filepath, image_type} : {filepath: string, image_type:string}){
    return (
        <div>
            <div className="flex flex-col items-center text-gray-600 font-bold">{image_type}</div>
            <img
                className="h-auto max-h-[450px] md:max-h-[660px] w-auto object-contain rounded-lg border-black border-3"
                src={filepath}
            />
        </div>
    );
}