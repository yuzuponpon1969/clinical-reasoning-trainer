const pdf = require('pdf-parse');
const fs = require('fs');

console.log('PDF Function:', typeof pdf); // Should be function

// Create a dummy PDF buffer (needs valid PDF header usually, but let's try calling it)
// pdf-parse might fail on invalid PDF, but checking if it's a function is key.
const dummyBuffer = Buffer.from('%PDF-1.4\n%...\n%%EOF');

async function test() {
    try {
        console.log('Calling pdf(buffer)...');
        // This might fail due to malformed PDF, but shouldn't be "not a function"
        await pdf(dummyBuffer); 
    } catch (e) {
        if (e.message.includes('Invalid PDF structure') || e.code === 'InvalidPDFException') {
             console.log('SUCCESS: Library invoked correctly (failed on dummy data as expected)');
        } else {
             console.log('ERROR:', e.message);
        }
    }
}

test();
