/**
 * Generates a List of IDs for QR codes.
 * @param count - The number of IDs to generate.
 * @returns 
 */
export function generateQrIds(count: number): string[] {
    const idList: string[] = [];
    for (let i = 0; i < count; i++) {
        const id = Math.random().toString(36).substr(2, 6).toUpperCase();
        idList.push(id);
    }
    return idList
}