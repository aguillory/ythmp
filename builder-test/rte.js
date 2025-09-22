import { state } from './state.js';
import { QUILL_TOOLBAR_OPTIONS } from './config.js';

export function initializeRTE() {
    if (typeof Quill === 'undefined') {
        console.error("Quill library not loaded.");
        return;
    }

    state.quillEditor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: QUILL_TOOLBAR_OPTIONS
        },
        placeholder: 'Enter notes or strategies...'
    });
}