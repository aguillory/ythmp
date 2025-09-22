// Utility functions
export function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'black';
        
        if (type !== 'info') {
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
        }
    }
}

export function copyToClipboard(text, successMessage = 'Copied!') {
    return navigator.clipboard.writeText(text).then(() => {
        showStatus(successMessage, 'success');
        return true;
    }).catch(err => {
        showStatus('Failed to copy', 'error');
        return false;
    });
}

export function formatBorderOutput(borderValue) {
    if (typeof borderValue !== 'string' || borderValue.length === 0 || borderValue.toLowerCase() === 'none') {
        return 'NONE';
    }
    return borderValue.charAt(0).toUpperCase() + borderValue.slice(1).toLowerCase();
}

export function normalizeBorderInput(border) {
    if (!border || border.toUpperCase() === 'NONE') return 'none';
    return border.toLowerCase();
}