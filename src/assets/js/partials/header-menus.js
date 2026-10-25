// One request for the header menu, shared by the desktop navigation and the footer categories.
let request = null;

export function headerMenus() {
    if (!request) request = globalThis.salla.api.component.getMenus().catch(error => {
        request = null;
        throw error;
    });
    return request;
}
