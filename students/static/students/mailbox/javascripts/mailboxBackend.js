// Function to handle post submission
async function handlePostSubmission(postData) {
    // Create FormData object to handle file uploads
    const formData = new FormData();
    
    // Add text content with a specific key
    if (postData.content) {
        formData.append('post_text', postData.content);
        console.log('Adding post text to FormData:', postData.content); // Debug log
    } else {
        console.warn('No post text content provided'); // Debug log
    }
     
    // Add files if any
    if (postData.files && postData.files.length > 0) {
        console.log('Processing files:', postData.files.length);
        for (let i = 0; i < postData.files.length; i++) {
            const file = postData.files[i];
            console.log(`Adding file ${i + 1}:`, { name: file.name, type: file.type, size: file.size });
            formData.append('files', file);
        }
        console.log('Added files to FormData:', postData.files.length); // Debug log
    } else {
        console.log('No files to add to FormData');
    }

    // Log the data being sent
    console.log('Sending data:', {
        post_text: postData.content,
        files: postData.files ? postData.files.map(f => ({ name: f.name, type: f.type, size: f.size })) : []
    });

    try {
        console.log('Sending request...');
        const response = await fetch('/students/mailbox/post/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Post submitted successfully:', data);
        alert('Post submitted successfully!');
    } catch (error) {
        console.error('Error submitting post:', error);
        alert('Error submitting post. Please try again.');
    }
}

// Export the function
export { handlePostSubmission }; 