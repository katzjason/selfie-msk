export interface Image {
    id: string;
    url: string;
    captureTime: string;
    mrn?: string;
    anatomicSite: string;
    lesionID?: string
}

export type ImageGroupData = {
    id: string;
    mrn?: string;
    anatomicSite: string;
    lesionID?: string;
    images: Image[];
}

export function groupImages(images: Image[]) : ImageGroupData[] {
    const groups = new Map<string, ImageGroupData>();

    for (const img of images) {
        const key = `${img.mrn || ''}||${img.anatomicSite}||${img.lesionID || ''}`;
        if (!groups.has(key)) {
            groups.set(key, {
                id: key,
                mrn: img.mrn,
                anatomicSite: img.anatomicSite,
                lesionID: img.lesionID,
                images: []
            });
        }
        groups.get(key)?.images.push(img);
    }
    
    return Array.from(groups.values());
}

export function dataUrlToBlob(dataUrl: string) {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] ?? "image/png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return new Blob([bytes], {type: mime});
}