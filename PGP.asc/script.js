    function copyPGPKey() {
        const pgpKeyText = document.querySelector('.pgp-key').innerText;
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = pgpKeyText;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);

        const copyButton = document.querySelector('.copy-button');
        copyButton.innerText = 'copied';
        copyButton.style.backgroundColor = '#946df7';

        setTimeout(function () {
            copyButton.innerText = 'copy';
        }, 2000);
    }
