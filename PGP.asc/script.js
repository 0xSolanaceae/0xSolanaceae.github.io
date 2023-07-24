function copyPGPKey() {
    const pgpKeyText = document.querySelector('.pgp-key').innerText;
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = pgpKeyText;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    const copyButton = document.querySelector('.copy-button');
    copyButton.innerText = 'Copied';
    copyButton.style.backgroundColor = '#a819c1b6'; // Darker color when clicked

    setTimeout(function () {
        copyButton.innerText = 'Copy';
        copyButton.style.backgroundColor = '#a819cf'; // Reset the button after 2 seconds
    }, 5000);
}