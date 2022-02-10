
export function storageMock() {
    const storage : Record<string, any> = {};
    return {
        setItem: function (key: string, value: any) {
            storage[key] = value || '';
        },
        getItem: function (key: string) {
            return key in storage ? storage[key] : null;
        },
        removeItem: function (key: string) {
            delete storage[key];
        },
        get length() {
            return Object.keys(storage).length;
        },
        key: function (i: number) {
            const keys = Object.keys(storage);
            return keys[i] || null;
        }
    };
}

(window as any).localStorage = storageMock();

