


export default function EnlargedImage({filepath, image_type} : {filepath: string, image_type:string}){
    return (
        <div>
            <div className="flex flex-col items-center text-gray-600 font-bold">{image_type}</div>
            <img
                className="w-full object-cover rounded-lg max-h-[450px] md:max-h-[660px] border-black border-3"
                src={filepath}
                // alt={value.image_type}
            />
        </div>
         
        // <div>HIIIIIIIIIIIIIIIIIIIII</div>
    );
}