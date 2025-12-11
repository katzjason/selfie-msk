

export default function CornerMarkers() {
  const size = "w-8 h-8"; 
  const border = "border-2 border-white";

  return (
    <>
      {/* TOP LEFT */}
      <div className={`absolute top-0 left-0 ${size} ${border} border-r-transparent border-b-transparent`} />

      {/* TOP RIGHT */}
      <div className={`absolute top-0 right-0 ${size} ${border} border-l-transparent border-b-transparent`} />

      {/* BOTTOM LEFT */}
      <div className={`absolute bottom-0 left-0 ${size} ${border} border-r-transparent border-t-transparent`} />

      {/* BOTTOM RIGHT */}
      <div className={`absolute bottom-0 right-0 ${size} ${border} border-l-transparent border-t-transparent`} />
    </>
  );
}