import { state } from './state.js';
import { generateBoardCodeObject } from './dataProcessing.js';
import { loadBoardFromData } from './eventHandlers.js';
import { showStatus } from './utils.js';

export function exportBoardAsText() {
    try {
        const boardData = generateBoardCodeObject();
        
        let notesHtml = "";
        if (state.quillEditor && state.quillEditor.getLength() > 1) {
            notesHtml = state.quillEditor.root.innerHTML;
        }

        const exportData = {
            version: "2.0",
            exportDate: new Date().toISOString(),
            boardData: boardData,
            notesHtml: notesHtml
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        
        // Show the text container with export data
        showJsonTextContainer('Export JSON Data', dataStr, 'export');
        
        showStatus('Board data ready for export!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showStatus('Export failed: ' + error.message, 'error');
    }
}

export function showImportTextContainer() {
    showJsonTextContainer('Import JSON Data', '', 'import');
}

function showJsonTextContainer(title, content, mode) {
    const container = document.getElementById('jsonTextContainer');
    const titleEl = document.getElementById('jsonTextTitle');
    const textArea = document.getElementById('jsonTextArea');
    const loadBtn = document.getElementById('loadJsonTextButton');
    
    if (container && titleEl && textArea) {
        titleEl.textContent = title;
        textArea.value = content;
        container.style.display = 'block';
        
        // Show/hide load button based on mode
        if (loadBtn) {
            loadBtn.style.display = mode === 'import' ? 'inline-block' : 'none';
        }
        
        // Focus and select text for export mode
        if (mode === 'export') {
            textArea.focus();
            textArea.select();
        }
    }
}
export function setupJsonTextListeners() {
    const copyBtn = document.getElementById('copyJsonTextButton');
    const loadBtn = document.getElementById('loadJsonTextButton');
    const closeBtn = document.getElementById('closeJsonTextButton');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textArea = document.getElementById('jsonTextArea');
            if (textArea && textArea.value) {
                navigator.clipboard.writeText(textArea.value).then(() => {
                    showStatus('Copied to clipboard!', 'success');
                }).catch(() => {
                    showStatus('Copy failed', 'error');
                });
            }
        });
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const textArea = document.getElementById('jsonTextArea');
            if (textArea && textArea.value.trim()) {
                try {
                    const importData = JSON.parse(textArea.value);
                    
                    let boardDataToLoad = null;
                    let notesHtmlToLoad = "";

                    // Check for new "export" format (with metadata)
                    if (importData.version && importData.boardData) {
                        boardDataToLoad = importData.boardData;
                        notesHtmlToLoad = importData.notesHtml || "";
                    
                    // Check for old "raw" format (the one you provided)
                    } else if (importData.tiles && importData.tiles.length > 0) {
                        boardDataToLoad = importData;
                        // No notes in this format, so notesHtmlToLoad remains ""
                    } else {
                        // If neither format matches, it's invalid
                        throw new Error('Invalid board data format. Not a recognized export or raw board object.');
                    }
                    
                    // Now, load the data we found
                    loadBoardFromData(boardDataToLoad);
                    
                    if (notesHtmlToLoad && state.quillEditor) {
                        state.quillEditor.root.innerHTML = notesHtmlToLoad;
                    }
                    
                    closeJsonTextContainer();
                    showStatus('Board loaded successfully!', 'success');
                    
                } catch (error) {
                    console.error('Load failed:', error);
                    showStatus('Load failed: ' + error.message, 'error');
                }
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeJsonTextContainer);
    }
}

function closeJsonTextContainer() {
    const container = document.getElementById('jsonTextContainer');
    if (container) {
        container.style.display = 'none';
        const textArea = document.getElementById('jsonTextArea');
        if (textArea) textArea.value = '';
    }
}

// Keep these for backward compatibility, but they now use text containers
export async function copyBoardToClipboard() {
    exportBoardAsText();
}

export async function loadBoardFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
            showJsonTextContainer('Import from Clipboard', text, 'import');
        } else {
            showStatus('Clipboard is empty', 'error');
        }
    } catch (error) {
        console.error('Read clipboard failed:', error);
        showStatus('Could not read clipboard', 'error');
    }
}