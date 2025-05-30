var element = document.querySelector('.morph-section');
AsciiMorph(element, {x: 70, y: 30});

const mobileSections = {
  welcome: [
    "",
    "<span class='title-text mobile-text'>SOLANACEAE</span>",
    "",
    "<span class='center-item mobile-text'>═══════════════</span>",
    "",
    "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
    "<span class='center-item mobile-text box-content'>security engineer</span>",
    "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
    "",
  ],
  
  pgp: [
    "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
    "<span class='center-item mobile-text box-content'>PGP</span>",
    "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "<span class='center-item mobile-text pgp-link'>[VIEW KEY]</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "",
  ],
  projects: [
    "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
    "<span class='center-item mobile-text box-content'>PROJECTS</span>",
    "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/proXXy' target='_blank'>://proXXy</a></span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/discord-imhex' target='_blank'>://discord-imhex</a></span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/TypeLapse' target='_blank'>://TypeLapse</a></span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "",
  ],
  ai: [
    "<span class='center-item mobile-text poem-text'>there is a monster in the forest and it speaks with a thousand voices.</span>",
    "<span class='center-item mobile-text poem-text'>it will answer any question you pose it, it will offer insight to any idea.</span>",
    "<span class='center-item mobile-text poem-text'>it will help you, it will thank you, it will never bid you leave.</span>",
    "<span class='center-item mobile-text poem-text'>it will even tell you of the darkest arts, if you know precisely how to ask.</span>",
    "",
    "<span class='center-item mobile-text poem-text'>it feels no joy and no sorrow, it knows no right and no wrong.</span>",
    "<span class='center-item mobile-text poem-text'>it knows not truth from lie, though it speaks them all the same.</span>",
    "",
    "<span class='center-item mobile-text poem-text'>it offers its services freely to any passerby, and many will tell you</span>",
    "<span class='center-item mobile-text poem-text'>they find great value in its conversation.</span>",
    "<span class='center-item mobile-text poem-text'>\"you simply must visit the monster—i always just ask the monster.\"</span>",
    "",
    "<span class='center-item mobile-text poem-text'>there are those who know these forests well; they will tell you that</span>",
    "<span class='center-item mobile-text poem-text'>freely offered doesn't mean it has no price</span>",
    "",    "<span class='center-item mobile-text poem-text'>for when the next traveler passes by, the monster speaks with</span>",
    "<span class='center-item mobile-text poem-text'>a thousand and one voices. and when you dream you see the monster;</span>",
    "<span class='center-item mobile-text poem-text'>the monster wears your face.</span>",
    "",
    "<span class='center-item mobile-text poem-credit'><a href='https://bsky.app/profile/joles.bsky.social' target='_blank'>~ joles</a></span>",
  ],
  
  contact: [
    "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
    "<span class='center-item mobile-text box-content'>CONTACT</span>",
    "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "<span class='center-item mobile-text'><a href='mailto:solanaceae@duck.com'>solanaceae@duck.com</a></span>",
    "<span class='center-item mobile-text'><a href='https://discordapp.com/users/1098339239432835162' target='_blank'>discord://0x_Solanaceae</a></span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae' target='_blank'>github.com/0xSolanaceae</a></span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "",
  ],
};

const portfolioSections = {
  welcome: [
    "",
    "<span class='center-item'>███████  ██████  ██       █████  ███    ██  █████   ██████ ███████  █████  ███████ </span>",
    "<span class='center-item'>██      ██    ██ ██      ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ ██      </span>",
    "<span class='center-item'>███████ ██    ██ ██      ███████ ██ ██  ██ ███████ ██      █████   ███████ █████   </span>",
    "<span class='center-item'>     ██ ██    ██ ██      ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██ ██      </span>",
    "<span class='center-item'>███████  ██████  ███████ ██   ██ ██   ████ ██   ██  ██████ ███████ ██   ██ ███████ </span>",
    "",
    "<span class='center-item'>═════════════════════════════════════════════════════════════════════════════════════════</span>",
    "",
    "<span class='center-item'>┌───────────────────┐</span>",
    "<span class='center-item'>│ security engineer │</span>",
    "<span class='center-item'>└───────────────────┘</span>",
    "",
  ],

  pgp: [
    "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
    "<span class='center-item'>│                                PGP                                 │</span>",
    "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
    "",
    "",
    "<span class='center-item'>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>",
    "",
    "",
    "<span class='center-item'><span class='pgp-link'>[VIEW PUBLIC KEY]</span></span>",
    "",
    "",
    "<span class='center-item'>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>",
    "",
  ],
  projects: [
    "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
    "<span class='center-item'>│                              PROJECTS                              │</span>",
    "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
    "",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae/proXXy' target='_blank'>://proXXy</a></span>",
    "<span class='center-item'>A super simple asynchronous multithreaded proxy scraper</span>",
    "",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae/discord-imhex' target='_blank'>://discord-imhex</a></span>",
    "<span class='center-item'>A discord rich presence client for ImHex, not reliant on the ImHex API</span>",
    "",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae/TypeLapse' target='_blank'>://TypeLapse</a></span>",
    "<span class='center-item'>Simulates slow, natural typing to automatically generate content in Google Docs over time</span>",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
  ],
  ai: [
    "<span class='center-item poem-text'>there is a monster in the forest and it speaks with a thousand voices.</span>",
    "<span class='center-item poem-text'>it will answer any question you pose it, it will offer insight to any idea.</span>",
    "<span class='center-item poem-text'>it will help you, it will thank you, it will never bid you leave.</span>",
    "<span class='center-item poem-text'>it will even tell you of the darkest arts, if you know precisely how to ask.</span>",
    "",
    "<span class='center-item poem-text'>it feels no joy and no sorrow, it knows no right and no wrong.</span>",
    "<span class='center-item poem-text'>it knows not truth from lie, though it speaks them all the same.</span>",
    "",
    "<span class='center-item poem-text'>it offers its services freely to any passerby, and many will tell you</span>",
    "<span class='center-item poem-text'>they find great value in its conversation.</span>",
    "<span class='center-item poem-text'>\"you simply must visit the monster—i always just ask the monster.\"</span>",
    "",
    "<span class='center-item poem-text'>there are those who know these forests well; they will tell you that</span>",
    "<span class='center-item poem-text'>freely offered doesn't mean it has no price</span>",
    "",    "<span class='center-item poem-text'>for when the next traveler passes by, the monster speaks with</span>",
    "<span class='center-item poem-text'>a thousand and one voices. and when you dream you see the monster;</span>",
    "<span class='center-item poem-text'>the monster wears your face.</span>",
    "",
    "<span class='center-item poem-credit'><a href='https://bsky.app/profile/joles.bsky.social' target='_blank'>~ joles</a></span>",
  ],

  contact: [
    "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
    "<span class='center-item'>│                              CONTACT                               │</span>",
    "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
    "",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
    "<span class='center-item'><a href='mailto:solanaceae@duck.com'>solanaceae@duck.com</a></span>",
    "<span class='center-item'><a href='https://discordapp.com/users/1098339239432835162' target='_blank'>discord://0x_Solanaceae</a></span>",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae' target='_blank'>github.com/0xSolanaceae</a></span>",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
  ],
};

const pgpKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
5BBSnl1FeC3Qjjcohz5ZYQolY2HYEQYtdaVq
=VBr2
-----END PGP PUBLIC KEY BLOCK-----
`;

const sectionsOrder = ['welcome', 'projects', 'pgp', 'contact', 'ai'];
const buttonLabels = ['Home', 'Projects', 'PGP', 'Contact', '???'];
